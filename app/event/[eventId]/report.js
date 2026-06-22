import { useLocalSearchParams } from "expo-router";
import { RoutePlaceholder } from "../../../components/RoutePlaceholder";

export default function ReportEventScreen() {
  const { eventId } = useLocalSearchParams();
  return <RoutePlaceholder title={`Report ${eventId || ""}`} description="Event report route placeholder." />;
}
