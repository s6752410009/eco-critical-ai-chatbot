import { useCurrentUser } from "./queries";
export function usePermissions({required=[]}={}){const {data:user}=useCurrentUser();const values=Array.isArray(required)?required:[required];return {hasAccess:values.some(value=>user.permissions.includes(value)),permissions:user.permissions};}
