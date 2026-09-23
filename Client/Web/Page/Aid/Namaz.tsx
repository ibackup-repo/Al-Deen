import { Layout } from "@Web/Component/Layout/Index";
import { Container } from "@Web/Component/UI/Container";

type Prayer_Step_Record = {
  Title_Text: string;
  Description_Body_Text: string;
};

const PRAYER_STEPS_COLLECTION: Prayer_Step_Record[] = [
  { Title_Text: "Intention (Niyyah)", Description_Body_Text: "Make the silent intention in your heart for the prayer you are about to perform." },
  { Title_Text: "Takbir", Description_Body_Text: "Raise your hands to your ears and say 'Allahu Akbar' to begin the prayer." },
  { Title_Text: "Qiyam", Description_Body_Text: "Place your right hand over your left on your chest and recite Surah Al-Fatihah followed by another Surah." },
  { Title_Text: "Ruku", Description_Body_Text: "Bow down, hands on knees, back straight, and say 'Subhana Rabbiyal Adheem' three times." },
  { Title_Text: "Standing from Ruku", Description_Body_Text: "Rise back to standing while saying 'Sami'a Allahu liman hamidah, Rabbana wa lakal hamd'." },
  { Title_Text: "Sujud", Description_Body_Text: "Prostrate with forehead, nose, palms, knees and toes on the ground. Say 'Subhana Rabbiyal A'la' three times." },
  { Title_Text: "Sitting Between Sujud", Description_Body_Text: "Sit briefly and say 'Rabbighfir li' before the second prostration." },
  { Title_Text: "Tashahhud", Description_Body_Text: "After the required rak'ahs, sit and recite the Tashahhud." },
  { Title_Text: "Salam", Description_Body_Text: "Turn your head to the right then the left saying 'As-salamu alaykum wa rahmatullah' to end the prayer." },
];

export default function Namaz() {
  return (
    <Layout>
      <div className="space-y-3">
        {PRAYER_STEPS_COLLECTION.map((Step_Item: Prayer_Step_Record, Step_Index_Position: number) => (
          <Container key={Step_Item.Title_Text} className="!p-4">
            <p className="text-xs text-muted-foreground">Step {Step_Index_Position + 1}</p>
            <p className="font-semibold mt-1">{Step_Item.Title_Text}</p>
            <p className="text-sm text-muted-foreground mt-1">{Step_Item.Description_Body_Text}</p>
          </Container>
        ))}
      </div>
    </Layout>
  );
}