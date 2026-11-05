import { createContext, useContext, useMemo } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
const Context = createContext(null);
export let snapshot = null;
export const EMPTY = [];
export const done = () => Promise.resolve();
export function NativeDataProvider({ value, children }) {
  snapshot = value;
  return <QueryClientProvider client={queryClient}><Context.Provider value={value}>{children}</Context.Provider></QueryClientProvider>;
}
export function useEcoData() { const value = useContext(Context); if (!value) throw new Error("Native Mentingo UI requires Eco data context"); return value; }
export function makeCourse(bridge, id) {
  const lesson = bridge.data.lessons.find(entry => entry.id === id) || bridge.available[0];
  if (!lesson) return null;
  const percent = bridge.progress(lesson.id);
  const topic = {air:"มลพิษทางอากาศ",water:"มลพิษทางน้ำ",plastic:"ขยะพลาสติก",climate:"ภูมิอากาศ"}[lesson.topic];
  return {
    id:lesson.id, slug:lesson.id, title:lesson.title, description:lesson.description,
    thumbnailUrl:`/classroom/${lesson.topic}.jpg`, trailerUrl:null, category:topic,
    estimatedDurationMinutes:lesson.minutes || 0, lessonCount:1, courseChapterCount:1,
    completedChapterCount:percent===100 ? 1 : 0, enrolled:true, hasFreeChapters:false,
    availableLocales:["th"],baseLanguage:"th", priceInCents:0, authorId:"teacher",
    learningState:{enabled:false},
    chapters:[{id:`${lesson.id}-chapter`,title:topic,displayOrder:1,chapterProgress:percent===100?"completed":"in_progress",isFreemium:true,lessons:[{id:lesson.id,title:lesson.title,type:"content",displayOrder:1,status:percent===100?"completed":"in_progress",isCompleted:percent===100}]}],
  };
}
export function makeLesson(bridge,id) {
 const lesson=bridge.data.lessons.find(entry=>entry.id===id) || bridge.lesson;
 if(!lesson)return null;
 return {...lesson,type:"content",description:lesson.description || "",lessonCompleted:bridge.progress(lesson.id)===100,hasVideo:false,hasTrackedVideo:false,videoCompletionTrackingEnabled:false,lessonResources:[],learningStateId:null};
}
export function useCourses() { const bridge=useEcoData();return useMemo(()=>bridge.available.map(lesson=>makeCourse(bridge,lesson.id)),[bridge]); }
