import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContactsTab } from "@/components/email/ContactsTab";
import { CampaignsTab } from "@/components/email/CampaignsTab";
import { SingleEmailTab } from "@/components/email/SingleEmailTab";
import { AutomaticEmailsTab } from "@/components/email/AutomaticEmailsTab";

export default function EmailManagement() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Levelező rendszer</h1>
        <p className="text-muted-foreground">
          Kezelje a kontaktjait, küldjön körlevelet vagy egyéni üzeneteket
        </p>
      </div>

      <Tabs defaultValue="contacts" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="contacts">Címzettek</TabsTrigger>
          <TabsTrigger value="campaigns">Körlevelek</TabsTrigger>
          <TabsTrigger value="single">Egyéni üzenet</TabsTrigger>
          <TabsTrigger value="automatic">Automata üzenetek</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
          <ContactsTab />
        </TabsContent>

        <TabsContent value="campaigns">
          <CampaignsTab />
        </TabsContent>

        <TabsContent value="single">
          <SingleEmailTab />
        </TabsContent>

        <TabsContent value="automatic">
          <AutomaticEmailsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}