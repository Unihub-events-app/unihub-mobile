import { useLocalSearchParams } from "expo-router";
import { RoutePlaceholder } from "../../../components/RoutePlaceholder";

export default function AdminEventsScreen() {
  const { eventId } = useLocalSearchParams();
  return <RoutePlaceholder title={`Admin Event ${eventId || ""}`} description="Admin event route placeholder." />;
}
