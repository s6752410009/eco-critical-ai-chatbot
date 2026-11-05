const language={language:"th",setLanguage:()=>{}};
export function useLanguageStore(selector){return selector?selector(language):language;}
