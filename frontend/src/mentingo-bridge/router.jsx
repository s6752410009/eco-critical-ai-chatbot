import {forwardRef,useCallback} from "react";
import {Link as RouterLink,useLocation as useRouterLocation,useNavigate as useRouterNavigate} from "react-router-dom";
import {useEcoData} from "./context";
function lessonTarget(to,bridge){if(typeof to!=="string")return null;const match=to.match(/^\/course\/([^/?]+)(?:\/lesson\/([^/?]+))?/);if(!match)return null;const id=match[2] || match[1];return bridge.available.some(lesson=>lesson.id===id)?id:null;}
function destination(to,bridge){
 if(typeof to!=="string")return to;
 const id=lessonTarget(to,bridge);
 if(id)return `/demo?screen=lesson&class=${encodeURIComponent(bridge.classroom.id)}&lesson=${encodeURIComponent(id)}`;
 if(to==="/courses" || to==="/")return `/demo?class=${encodeURIComponent(bridge.classroom.id)}`;
 return to;
}
export const Link=forwardRef(function NativeLink({to,discover:Discover,prefetch:Prefetch,reloadDocument:ReloadDocument,onClick,...props},ref){const bridge=useEcoData();return <RouterLink ref={ref} to={destination(to,bridge)} onClick={event=>{onClick?.(event);const id=lessonTarget(to,bridge);if(!event.defaultPrevented && id && event.button===0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && (!props.target || props.target==="_self")){event.preventDefault();bridge.onOpenLesson(id);}}} {...props}/>;});
export function useNavigate(){const bridge=useEcoData();const navigate=useRouterNavigate();return useCallback((to,options)=>{const id=lessonTarget(to,bridge);if(id){bridge.onOpenLesson(id);return;}navigate(destination(to,bridge),options);},[navigate,bridge]);}
export function useParams(){const bridge=useEcoData();const id=bridge.lesson?.id || bridge.available[0]?.id;return {courseId:id,lessonId:id};}
export const useLocation=useRouterLocation;
