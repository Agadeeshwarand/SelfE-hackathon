import {Navigate} from "react-router-dom"; import {useAuth} from "../lib/auth"; import {homeForRole} from "../lib/api";
export default function DashboardPage(){const{user}=useAuth();return <Navigate to={user?homeForRole(user.role):"/login"} replace/>}
