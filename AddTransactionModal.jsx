import React, { useState, useEffect } from "react";
import ModalContainer from "../ui/ModalContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useApp } from "../contexts/AppContext";
import { useOffline } from "../contexts/OfflineContext";
import { toast } from "sonner";
import DatePicker from "../ui/DatePicker";
import {
  createLocalTransaction,
  updateLocalTransaction,
} from "@/database/transactionRepository";
import { syncTransactions } from "@/services/syncService";

// FIX: This entire file has been rewritten to use the correct local-first
// architecture. The original implementation used a Preferences-based queue
// that flushed directly to Base44. This was the single biggest root cause
// of every reported bug:
//
//  - Save button stuck on "Saving…" offline
//    → Old code awaited base44.entities.Transaction.create() which hangs
//      when there is no network. New code writes to SQLite instantly.
//
//  - Amounts not appearing on Dashboard after save (online)
//    → Dashboard reads from getLocalTransactions() (SQLite). Old code wrote
//      to Base44 only — SQLite never saw the new record so Dashboard showed
//      nothing. New code writes to SQLite first so Dashboard sees it
//      immediately on refetch().
//
//  - Data disappearing after app restart (offline)
//    → Old Preferences queue was fire-and-forget. Records existed only in
//      the queue until flushed, never in SQLite. New code writes to SQLite
//      immediately — SQLite persists across restarts.
//
// The correct flow is:
//   1. Write to SQLite with sync_status = 'pending'  ← instant, works offline
//   2. Call onSuccess() so Dashboard refetch() fires ← UI updates immediately
//   3. Call syncTransactions() in background          ← pushes to Base44 when online

export default function AddTransactionModal({
  open,
  onClose,
  onSuccess,
  defaultType = "expense",
  defaultCategory = "",
  editingTransaction = null,
  lockType = false,
  selectedDate = null,
  disableAutoEdit = false
}) {
  const { t, theme, user, isReadOnly } = useApp();
  const { isOnline } = useOffline();
  const isDark = theme === "dark";

  const [lockedType, setLockedType] = useState(defaultType);
  const [formData, setFormData] = useState({
    type: defaultType,
    category: defaultCategory || "",
    amount: "",
    date: selectedDate || new Date().toISOString().split("T")[0],
    platform: "",
    description: ""
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentEditingTransaction, setCurrentEditingTransaction] = useState(null);

  useEffect(() => {
    if (!open) return;

    if (editingTransaction?.id && !disableAutoEdit) {
      const transactionType = editingTransaction.type || defaultType;

      setCurrentEditingTransaction(editingTransaction);
      setLockedType(transactionType);
      setFormData({
        type: transactionType,
        category: editingTransaction.category || defaultCategory || "",
        amount:
          editingTransaction.amount !== undefined &&
          editingTransaction.amount !== null
            ? String(editingTransaction.amount)
            : "",
        date:
          editingTransaction.date ||
          editingTransaction.transaction_date ||
          selectedDate ||
          new Date().toISOString().split("T")[0],
        platform: editingTransaction.platform || "",
        description: editingTransaction.description || ""
      });
    } else {
      setCurrentEditingTransaction(null);
      setLockedType(defaultType);
      setFormData({
        type: defaultType,
        category: defaultCategory || "",
        amount: "",
        date: selectedDate || new Date().toISOString().split("T")[0],
        platform: "",
        description: ""
      });
    }

    setErrors({});
    setLoading(false);
  }, [open, defaultType, defaultCategory, editingTransaction, selectedDate, disableAutoEdit]);

  const incomeCategories = [
    { value: "gross_income", label: "Driver Earnings / Payout" },
    { value: "tip", label: "🤑 Tip" },
    { value: "extra_income", label: "💰 Extra Income" }
  ];

  const expenseCategories = [
    { value: "fuel", label: "⛽ Fuel" },
    { value: "food", label: "🍔 Food" },
    { value: "load", label: "📱 Load" },
    { value: "topup", label: "💳 Top-Up" },
    { value: "maintenance", label: "🔧 Maintenance" },
    { value: "parking_ticket", label: "🅿️ Parking Ticket" },
    { value: "toll", label: "🛣️ Toll" },
    { value: "gate_pass", label: "🎫 Gate Pass" },
    { value: "wash_cleaning", label: "🚿 Wash / Cleaning" },
    { value: "penalty_violation", label: "🚨 Penalty / Violation" },
    { value: "permit", label: "📋 Permit" },
    { value: "drivers_license_renewal", label: "🪪 Driver's License Renewal" },
    { value: "vehicle_registration", label: "📝 Vehicle Registration" },
    { value: "vehicle_insurance", label: "🛡️ Vehicle Insurance" },
    { value: "other", label: "🧾 Other" }
  ];

  const platforms = user?.platforms_used || ["Grab", "Foodpanda", "Lalamove"];

  const activeType = lockType ? lockedType : formData.type;
  const categoryOptions =
    activeType === "income" ? incomeCategories : expenseCategories;

  const resetForm = () => {
    setLockedType(defaultType);
    setCurrentEditingTransaction(null);
    setErrors({});
    setLoading(false);
    setFormData({
      type: defaultType,
      category: defaultCategory || "",
      amount: "",
      date: selectedDate || new Date().toISOString().split("T")[0],
      platform: "",
      description: ""
    });
  };

  const handleClose = () => {
    if (loading) return;
    onClose?.();
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (isReadOnly()) {
      toast.error("Upgrade to unlock editing");
      return;
    }

    const tx = currentEditingTransaction;
    const isEditMode = !!tx?.id;
    const selectedCategory = formData.category;

    const newErrors = {};

    if (!selectedCategory) {
      newErrors.category = "Category is required";
    }

    const parsedAmount = parseFloat(formData.amount);
    if (!formData.amount || Number.isNaN(parsedAmount)) {
      newErrors.amount = "Amount is required";
    } else if (parsedAmount < 0) {
      newErrors.amount = "Amount must be 0 or more";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    }

    if (activeType === "income" && !formData.platform) {
      newErrors.platform = "Platform is required.";
    }

    const incomeCategoryValues = incomeCategories.map((c) => c.value);
    const expenseCategoryValues = expenseCategories.map((c) => c.value);

    if (activeType === "income" && expenseCategoryValues.includes(selectedCategory)) {
      toast.error("Cannot save: Income transaction with expense category");
      return;
    }

    if (activeType === "expense" && incomeCategoryValues.includes(selectedCategory)) {
      toast.error("Cannot save: Expense transaction with income category");
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const now = new Date().toISOString();

      if (isEditMode && tx?.id) {
        // ── EDIT MODE ─────────────────────────────────────────────────────────
        // FIX: Write to SQLite immediately — works offline and online.
        // Old code called base44.entities.Transaction.update() directly which
        // hangs offline and bypasses the local database entirely.
        await updateLocalTransaction(tx.id, {
          type: activeType,
          category: selectedCategory,
          amount: parsedAmount,
          date: formData.date,
          transaction_date: formData.date,
          platform: activeType === "income" ? formData.platform || "" : "",
          description: formData.description || "",
          period: "daily",
          updated_at: now,
        });

        toast.success("Transaction updated");
      } else {
        // ── CREATE MODE ───────────────────────────────────────────────────────
        // FIX: Write to SQLite immediately — works offline and online.
        // Old code called base44.entities.Transaction.create() directly which
        // hangs offline. Old code also used addToQueue() to Preferences which
        // Dashboard's getLocalTransactions() never reads — data was invisible.
        const localId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        await createLocalTransaction({
          id: localId,
          remote_id: null,
          type: activeType,
          category: selectedCategory,
          amount: parsedAmount,
          date: formData.date,
          transaction_date: formData.date,
          platform: activeType === "income" ? formData.platform || "" : "",
          description: formData.description || "",
          period: "daily",
          created_by: user?.email || "",
          created_at: now,
          updated_at: now,
          sync_status: "pending",
          sync_error: null,
        });

        toast.success(
          isOnline
            ? "Transaction added"
            : "Saved offline — will sync when reconnected"
        );
      }

      // FIX: Call onSuccess BEFORE syncing so Dashboard refetch() fires
      // immediately and the new record appears in the UI right away.
      // syncTransactions runs in the background — non-blocking.
      onSuccess?.();
      onClose?.();
      resetForm();

      // Push to Base44 in background if online — never blocks the UI
      if (isOnline && user?.email) {
        syncTransactions(user.email).catch(e =>
          console.warn("[AddTransactionModal] background sync failed (non-fatal):", e)
        );
      }

    } catch (error) {
      console.error("[AddTransactionModal] Save failed:", error);
      toast.error("Failed to save transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const categoryToUse =
    currentEditingTransaction?.category || formData.category || defaultCategory;
  const isAddModeWithoutCategory = !currentEditingTransaction && !categoryToUse;

  if (isAddModeWithoutCategory && open) {
    return (
      <ModalContainer
        open={open}
        onClose={handleClose}
        isDark={isDark}
        title="Cannot Add Transaction"
      >
        <div className="space-y-4 py-4">
          <p
            className={`text-sm ${
              isDark ? "text-white/70" : "text-gray-600"
            } text-center`}
          >
            Please add transactions from the Dashboard using the category + buttons.
          </p>
          <Button onClick={handleClose} className="w-full h-9 text-sm btn-primary">
            Close
          </Button>
        </div>
      </ModalContainer>
    );
  }

  return (
    <ModalContainer
      open={open}
      onClose={handleClose}
      isDark={isDark}
      title={
        currentEditingTransaction?.id
          ? activeType === "income"
            ? "Edit Income"
            : "Edit Expense"
          : activeType === "income"
          ? "Add Income"
          : "Add Expense"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-2">
        {!lockType && (
          <div>
            <Label className="mb-1.5 block text-sm">Type</Label>
            <div className="flex gap-6">
              <label
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    type: "income",
                    category: ""
                  }))
                }
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    formData.type === "income"
                      ? "border-[#66BB6A] shadow-[0_0_6px_rgba(102,187,106,0.4)]"
                      : isDark
                      ? "border-white/70"
                      : "border-gray-400"
                  }`}
                >
                  {formData.type === "income" && (
                    <div className="w-3 h-3 rounded-full bg-[#66BB6A]" />
                  )}
                </div>
                <span className={isDark ? "text-white" : "text-gray-900"}>
                  Income
                </span>
              </label>

              <label
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    type: "expense",
                    category: "",
                    platform: ""
                  }))
                }
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    formData.type === "expense"
                      ? "border-[#66BB6A] shadow-[0_0_6px_rgba(102,187,106,0.4)]"
                      : isDark
                      ? "border-white/70"
                      : "border-gray-400"
                  }`}
                >
                  {formData.type === "expense" && (
                    <div className="w-3 h-3 rounded-full bg-[#66BB6A]" />
                  )}
                </div>
                <span className={isDark ? "text-white" : "text-gray-900"}>
                  Expense
                </span>
              </label>
            </div>
          </div>
        )}

        <div>
          <Label className="mb-1.5 block text-sm">
            Category <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) => {
              setFormData((prev) => ({ ...prev, category: value }));
              setErrors((prev) => ({ ...prev, category: "" }));
            }}
          >
            <SelectTrigger
              className={`${isDark ? "dark-select-trigger" : ""} ${
                errors.category ? "border-red-500" : ""
              }`}
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent
              className={isDark ? "dark-select-content" : "light-select-content"}
            >
              {categoryOptions.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-red-500 text-xs mt-1">{errors.category}</p>
          )}
        </div>

        <div>
          <Label className="mb-1.5 block text-sm">
            {t("AMOUNT")} <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, amount: e.target.value }));
              setErrors((prev) => ({ ...prev, amount: "" }));
            }}
            placeholder="0.00"
            className={`${isDark ? "bg-white/10 text-white border-white/20" : ""} ${
              errors.amount ? "border-red-500" : ""
            }`}
          />
          {errors.amount && (
            <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
          )}
        </div>

        <div>
          <Label className="mb-1.5 block text-sm">
            {t("DATE")} <span className="text-red-500">*</span>
          </Label>
          <DatePicker
            value={formData.date}
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, date: value }));
              setErrors((prev) => ({ ...prev, date: "" }));
            }}
            placeholder="Select date"
          />
          {errors.date && (
            <p className="text-red-500 text-xs mt-1">{errors.date}</p>
          )}
        </div>

        {activeType === "income" && (
          <div>
            <Label className="mb-1.5 block text-sm">
              Platform <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.platform}
              onValueChange={(value) => {
                setFormData((prev) => ({ ...prev, platform: value }));
                setErrors((prev) => ({ ...prev, platform: "" }));
              }}
            >
              <SelectTrigger
                className={`${isDark ? "dark-select-trigger" : ""} ${
                  errors.platform ? "border-red-500" : ""
                }`}
              >
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent
                className={isDark ? "dark-select-content" : "light-select-content"}
              >
                {platforms.map((platform) => (
                  <SelectItem key={platform} value={platform}>
                    {platform}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.platform && (
              <p className="text-red-500 text-xs mt-1">{errors.platform}</p>
            )}
          </div>
        )}

        <div>
          <Label className="mb-1.5 block text-sm">Notes (Optional)</Label>
          <Textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Add details..."
            rows={2}
            className={isDark ? "bg-white/10 text-white border-white/20" : ""}
          />
        </div>

        {!isOnline && (
          <p className="text-xs text-yellow-500 text-center">
            📵 Offline — will sync automatically when reconnected.
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className={`flex-1 h-9 text-sm ${isDark ? "btn-secondary" : ""}`}
          >
            {t("CANCEL")}
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 h-9 text-sm btn-primary"
          >
            {loading
              ? "Saving..."
              : currentEditingTransaction?.id
              ? "Save Changes"
              : t("SAVE")}
          </Button>
        </div>
      </form>
    </ModalContainer>
  );
}
