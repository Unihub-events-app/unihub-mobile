import { useLocalSearchParams } from "expo-router";
import { RoutePlaceholder } from "../../components/RoutePlaceholder";

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams();

  return (
    <RoutePlaceholder
      title={`Event ${eventId || ""}`}
      description="The dynamic event detail route is mapped and ready for the full ticketing, ownership, and chat UI to be ported over."
    />
  );
}
