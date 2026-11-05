import { NavigationMenuButton } from "../mentingo/components/Navigation/NavigationMenuButton";
const icons = {
  members: "Users",
  "ai-settings": "Settings",
  cases: "Globe",
  discussions: "MessagesSquare",
  dashboard: "Dashboard",
  classrooms: "Hat",
  lessons: "BookOpen",
  chat: "MessagesSquare",
  progress: "ChartNoAxes",
  knowledge: "Directory",
  questions: "MessagesSquare",
};
export function NativeNavigation({ items, screen, onNavigate }) {
  return (
    <ul className="eco-native-nav-list">
      {items.map((item) => (
        <NavigationMenuButton
          key={item.id}
          item={{ label: item.label, iconName: icons[item.id] || "BookOpen" }}
          onClick={() => onNavigate(item.id)}
          hideLabel
          showTooltip
          className={
            screen === item.id || (screen === "lesson" && item.id === "lessons")
              ? "eco-native-nav-active"
              : ""
          }
        />
      ))}
    </ul>
  );
}
