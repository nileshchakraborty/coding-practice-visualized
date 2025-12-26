export enum CircuitState {
    CLOSED,
    OPEN,
    HALF_OPEN
}

interface CircuitBreakerOptions {
    failureThreshold: number;
    resetTimeout: number; // in ms
}

export class CircuitBreaker {
    private state: CircuitState = CircuitState.CLOSED;
    private failureCount: number = 0;
    private lastFailureTime: number = 0;
    private readonly failureThreshold: number;
    private readonly resetTimeout: number;
    private name: string;

    constructor(name: string, options: CircuitBreakerOptions = { failureThreshold: 3, resetTimeout: 5000 }) {
        this.name = name;
        this.failureThreshold = options.failureThreshold;
        this.resetTimeout = options.resetTimeout;
    }

    public async execute<T>(action: () => Promise<T>, fallback?: () => Promise<T>): Promise<T> {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() - this.lastFailureTime > this.resetTimeout) {
                this.state = CircuitState.HALF_OPEN;
                console.log(`[CB:${this.name}] Circuit HALF-OPEN. Probing...`);
            } else {
                // Circuit is open, fast fail
                // console.warn(`[CB:${this.name}] Circuit OPEN. Fast failing.`);
                if (fallback) return fallback();
                throw new Error(`[CB:${this.name}] Circuit is OPEN`);
            }
        }

        try {
            const result = await action();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            if (fallback) return fallback();
            throw error;
        }
    }

    private onSuccess() {
        if (this.state === CircuitState.HALF_OPEN) {
            console.log(`[CB:${this.name}] Circuit closed (recovered)`);
            this.state = CircuitState.CLOSED;
            this.failureCount = 0;
        } else if (this.state === CircuitState.CLOSED) {
            // Reset failure count on successful execution in closed state if we want to be generous?
            // Usually we only reset if it was clean for a while, but simple resetting failureCount on success works for now.
            this.failureCount = 0;
        }
    }

    private onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.OPEN;
            console.log(`[CB:${this.name}] Probe failed. Re-opening circuit.`);
        } else if (this.failureCount >= this.failureThreshold) {
            this.state = CircuitState.OPEN;
            console.warn(`[CB:${this.name}] Failure threshold reached. Circuit OPEN.`);
        }
    }

    public getState(): CircuitState {
        return this.state;
    }
}
