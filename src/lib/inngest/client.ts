import { EventSchemas, Inngest } from "inngest";

// Define strict event types
type Events = {
    "appeal/sent": {
        data: {
            appealId: string;
            userId: string;
            lawContext: string;
        };
    };
    "appeal/escalate": {
        data: {
            appealId: string;
        };
    };
};

export const inngest = new Inngest({ 
    id: "medical-auditor", 
    schemas: new EventSchemas().fromRecord<Events>() 
});
