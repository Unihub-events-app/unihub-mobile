import { useLocalSearchParams } from "expo-router";
import { RoutePlaceholder } from "../../../components/RoutePlaceholder";

export default function ManageEventScreen() {
  const { eventId } = useLocalSearchParams();
  return <RoutePlaceholder title={`Manage ${eventId || ""}`} description="Event management route placeholder." />;
}
