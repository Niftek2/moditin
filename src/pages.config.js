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
import Accommodations from './pages/Accommodations';
import ActivityPlanner from './pages/ActivityPlanner';
import Calendar from './pages/Calendar';
import Dashboard from './pages/Dashboard';
import Equipment from './pages/Equipment';
import GoalBank from './pages/GoalBank';
import InteractiveActivities from './pages/InteractiveActivities';
import LabelingActivities from './pages/LabelingActivities';
import Ling6Check from './pages/Ling6Check';
import Mileage from './pages/Mileage';
import MyDay from './pages/MyDay';
import Onboarding from './pages/Onboarding';
import Reminders from './pages/Reminders';
import ServiceHours from './pages/ServiceHours';
import Settings from './pages/Settings';
import StudentDetail from './pages/StudentDetail';
import Students from './pages/Students';
import TestingDecisions from './pages/TestingDecisions';
import UploadLing6Sounds from './pages/UploadLing6Sounds';
import Worksheets from './pages/Worksheets';
import Join from './pages/Join';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Accommodations": Accommodations,
    "ActivityPlanner": ActivityPlanner,
    "Calendar": Calendar,
    "Dashboard": Dashboard,
    "Equipment": Equipment,
    "GoalBank": GoalBank,
    "InteractiveActivities": InteractiveActivities,
    "LabelingActivities": LabelingActivities,
    "Ling6Check": Ling6Check,
    "Mileage": Mileage,
    "MyDay": MyDay,
    "Onboarding": Onboarding,
    "Reminders": Reminders,
    "ServiceHours": ServiceHours,
    "Settings": Settings,
    "StudentDetail": StudentDetail,
    "Students": Students,
    "TestingDecisions": TestingDecisions,
    "UploadLing6Sounds": UploadLing6Sounds,
    "Worksheets": Worksheets,
    "Join": Join,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};