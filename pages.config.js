/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import About from './pages/About';
import Login from './pages/Login';
import LoggedOut from './pages/LoggedOut';
import Analytics from './pages/Analytics';
import Dashboard from './pages/Dashboard';
import ExportsData from './pages/ExportsData';
import FinanceData from './pages/FinanceData';
import GeneralSettings from './pages/GeneralSettings';
import Home from './pages/Home';
import LanguageSelect from './pages/LanguageSelect';
import MaintenanceTracker from './pages/MaintenanceTracker';
import Me from './pages/Me';
import Notifications from './pages/Notifications';
import NotificationsAutomation from './pages/NotificationsAutomation';
import Onboarding from './pages/Onboarding';
import ProfileSettings from './pages/ProfileSettings';
import PushTest from './pages/PushTest';
import Savings from './pages/Savings';
import Settings from './pages/Settings';
import Subscription from './pages/Subscription';
import System from './pages/System';
import TermsOfUse from './pages/TermsOfUse';
import Transactions from './pages/Transactions';
import UserAccount from './pages/UserAccount';
import Utilities from './pages/Utilities';
import VehicleMaintenance from './pages/VehicleMaintenance';
import privacypolicy from './pages/privacypolicy';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "Login": Login,
    "LoggedOut": LoggedOut,
    "Analytics": Analytics,
    "Dashboard": Dashboard,
    "ExportsData": ExportsData,
    "FinanceData": FinanceData,
    "GeneralSettings": GeneralSettings,
    "Home": Home,
    "LanguageSelect": LanguageSelect,
    "MaintenanceTracker": MaintenanceTracker,
    "Me": Me,
    "Notifications": Notifications,
    "NotificationsAutomation": NotificationsAutomation,
    "Onboarding": Onboarding,
    "ProfileSettings": ProfileSettings,
    "PushTest": PushTest,
    "Savings": Savings,
    "Settings": Settings,
    "Subscription": Subscription,
    "System": System,
    "TermsOfUse": TermsOfUse,
    "Transactions": Transactions,
    "UserAccount": UserAccount,
    "Utilities": Utilities,
    "VehicleMaintenance": VehicleMaintenance,
    "privacypolicy": privacypolicy,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};