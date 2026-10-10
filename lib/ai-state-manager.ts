/**
 * AI State Manager (External State Container)
 * 
 * Enforces the "Stateless Agent" architecture where agents 
 * receive state as input and return desired state changes, 
 * but never store state internally.
 */

export interface SystemState {
    sessionId: string;
    history: Array<{ role: 'user' | 'assistant' | 'system', content: string }>;
    uiContext: {
        activePath: string;
        selectedMovieId?: string;
        filters: Record<string, any>;
    };
    vectorMemoryKeys: string[];
}

export class ExternalStateManager {
    private static instance: ExternalStateManager;
    private state: SystemState;

    private constructor() {
        this.state = {
            sessionId: `sess_${Math.random().toString(36).substr(2, 9)}`,
            history: [],
            uiContext: {
                activePath: '/',
                filters: {}
            },
            vectorMemoryKeys: []
        };
    }

    public static getInstance(): ExternalStateManager {
        if (!ExternalStateManager.instance) {
            ExternalStateManager.instance = new ExternalStateManager();
        }
        return ExternalStateManager.instance;
    }

    /**
     * Snapshot current state for agent consumption
     */
    public getStateSnapshot(): SystemState {
        return JSON.parse(JSON.stringify(this.state));
    }

    /**
     * Apply state updates from an agent
     */
    public updateState(updates: Partial<SystemState>): void {
        this.state = { ...this.state, ...updates };
        console.log('[SystemState][Updated]', this.state);
    }

    /**
     * Atomic update for history
     */
    public pushHistory(role: 'user' | 'assistant' | 'system', content: string): void {
        this.state.history.push({ role, content });
    }
}

/**
 * Example of a Stateless Agent Implementation
 */
export async function runStatelessAgent<T>(
    agentLogic: (state: SystemState, input: any) => Promise<T>,
    input: any
): Promise<T> {
    const manager = ExternalStateManager.getInstance();
    const currentSnapshot = manager.getStateSnapshot();

    // Agent is called with the full snapshot, maintaining its statelessness
    const result = await agentLogic(currentSnapshot, input);

    return result;
}
