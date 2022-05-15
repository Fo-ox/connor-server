export class JiraIntegrationTaskDto {
    id: number;
    key: string;
    fields: {
        issuetype: {
            id: number;
            name: string;
            subtask: boolean;
            namedValue: string;
        };
        project: {
            id: number;
            key: string;
            name: string;
            description: string;
            avatarUrls: {
                "48x48": string;
            };
            projectTypeKey: string;
        };
        fixVersions: string[];
        aggregatetimespent: number; // 414600
        resolution: {
            id: number;
            name: string; // "Done"
            description: string;
            namedValue: string; // "Done"
        }; // if completed
        customfield_10028: string[]; // components ["[APP]-main"]
        customfield_10029: {
            value: string;  // "Medium",
            id: string; // "10021"
        }; // task estimation
        resolutiondate: string;
        created: number; //1652548222619
        priority: {
            id: number;
            name: string;
            iconUrl: string;
            namedValue: string;
        };
        labels: string[];
        assignee: {
            accountId: string;
            emailAddress: string;
            avatarUrls: {
                "48x48": string;
            };
            displayName: string;
        };
        updated: number;
        status: {
            iconUrl: string;
            name: string;
            id: number;
            statusCategory: {
                id: number;
                key: string; // "indeterminate"
                colorName: string; //yellow
                name: string; // "In Progress"
            };
        };
        timetracking: {
            remainingEstimate: string;
            timeSpent: string;
            originalEstimateSeconds: number;
            remainingEstimateSeconds: number;
            timeSpentSeconds: number;
        };
        summary: string;
        reporter: {
            name: string;
            key: string;
            accountId: string;
            emailAddress: string;
            avatarUrls: {
                "48x48": string;
            };
            displayName: string;
            active: boolean;
        };
        duedate: string;
        progress: {
            progress: number;
            total: number;
            percent: number;
        };
    };
}
