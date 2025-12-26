
export interface Topic {
    id: string;
    name: string;
    slug: string;
    aliases: string[];
    icon: string;
}

export interface TopicRepository {
    getAll(): Promise<Topic[]>;
    upsert(topic: Partial<Topic>): Promise<Topic>;
    normalizeProblems(problemsTable: string): Promise<{ updated: number, errors: any[] }>;
}
