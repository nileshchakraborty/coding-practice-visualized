/**
 * GeoLocationService - PII-compliant IP hashing and city-level geolocation
 * IMPORTANT: Never stores raw IP addresses, only SHA-256 hashes
 * Uses ip-api.com (free) or ipinfo.io for city-level lookups only
 */
import crypto from 'crypto';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface GeoLocation {
    ip_hash: string;     // SHA-256 hash of IP
    geo_city: string;    // City name (e.g., 'San Francisco')
    geo_country: string; // Country code (e.g., 'US')
}

interface IpApiResponse {
    status: 'success' | 'fail';
    city?: string;
    countryCode?: string;
    message?: string;
}

interface IpInfoResponse {
    city?: string;
    country?: string;
    error?: { title: string; message: string };
}

// ============================================
// GEO LOCATION SERVICE
// ============================================

class GeoLocationService {
    private readonly provider: 'ip-api' | 'ipinfo';
    private readonly ipInfoToken: string | undefined;
    private readonly cache: Map<string, GeoLocation> = new Map();
    private readonly cacheTTL = 60 * 60 * 1000; // 1 hour

    constructor() {
        this.provider = (process.env.GEOIP_PROVIDER as 'ip-api' | 'ipinfo') || 'ip-api';
        this.ipInfoToken = process.env.IPINFO_TOKEN;
    }

    /**
     * Hash an IP address using SHA-256
     * This is a one-way hash - the original IP cannot be recovered
     */
    hashIP(ip: string): string {
        // Add a salt to make rainbow table attacks harder
        const salt = process.env.IP_HASH_SALT || 'codenium-pii-salt-2024';
        return crypto
            .createHash('sha256')
            .update(`${salt}:${ip}`)
            .digest('hex');
    }

    /**
     * Get city-level geolocation from IP
     * Only returns city and country - no precise coordinates
     */
    async getGeoLocation(ip: string): Promise<GeoLocation> {
        const ipHash = this.hashIP(ip);

        // Check cache first
        if (this.cache.has(ipHash)) {
            return this.cache.get(ipHash)!;
        }

        let city = 'Unknown';
        let country = 'XX';

        try {
            // Skip geolocation for local/private IPs
            if (this.isPrivateIP(ip)) {
                return { ip_hash: ipHash, geo_city: 'Local', geo_country: 'XX' };
            }

            if (this.provider === 'ip-api') {
                const result = await this.lookupWithIpApi(ip);
                city = result.city;
                country = result.country;
            } else if (this.provider === 'ipinfo' && this.ipInfoToken) {
                const result = await this.lookupWithIpInfo(ip);
                city = result.city;
                country = result.country;
            }
        } catch (error) {
            console.warn('[GeoLocation] Lookup failed:', error);
            // Return unknown but don't throw - geolocation is non-critical
        }

        const geoLocation: GeoLocation = {
            ip_hash: ipHash,
            geo_city: city,
            geo_country: country,
        };

        // Cache the result
        this.cache.set(ipHash, geoLocation);
        setTimeout(() => this.cache.delete(ipHash), this.cacheTTL);

        return geoLocation;
    }

    /**
     * Lookup using ip-api.com (free, 45 req/min limit)
     */
    private async lookupWithIpApi(ip: string): Promise<{ city: string; country: string }> {
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,countryCode,message`);
        const data: IpApiResponse = await response.json();

        if (data.status === 'fail') {
            console.warn('[GeoLocation] ip-api error:', data.message);
            return { city: 'Unknown', country: 'XX' };
        }

        return {
            city: data.city || 'Unknown',
            country: data.countryCode || 'XX',
        };
    }

    /**
     * Lookup using ipinfo.io (requires token, higher limits)
     */
    private async lookupWithIpInfo(ip: string): Promise<{ city: string; country: string }> {
        const response = await fetch(`https://ipinfo.io/${ip}/json?token=${this.ipInfoToken}`);
        const data: IpInfoResponse = await response.json();

        if (data.error) {
            console.warn('[GeoLocation] ipinfo error:', data.error.message);
            return { city: 'Unknown', country: 'XX' };
        }

        return {
            city: data.city || 'Unknown',
            country: data.country || 'XX',
        };
    }

    /**
     * Check if IP is a private/local address
     */
    private isPrivateIP(ip: string): boolean {
        // IPv4 private ranges
        if (ip.startsWith('10.') ||
            ip.startsWith('192.168.') ||
            ip.startsWith('127.') ||
            ip.startsWith('172.16.') ||
            ip.startsWith('172.17.') ||
            ip.startsWith('172.18.') ||
            ip.startsWith('172.19.') ||
            ip.startsWith('172.20.') ||
            ip.startsWith('172.21.') ||
            ip.startsWith('172.22.') ||
            ip.startsWith('172.23.') ||
            ip.startsWith('172.24.') ||
            ip.startsWith('172.25.') ||
            ip.startsWith('172.26.') ||
            ip.startsWith('172.27.') ||
            ip.startsWith('172.28.') ||
            ip.startsWith('172.29.') ||
            ip.startsWith('172.30.') ||
            ip.startsWith('172.31.') ||
            ip === 'localhost') {
            return true;
        }

        // IPv6 localhost
        if (ip === '::1' || ip === '::ffff:127.0.0.1') {
            return true;
        }

        return false;
    }

    /**
     * Extract client IP from request headers
     * Handles proxies, load balancers, and direct connections
     */
    getClientIP(req: { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }): string {
        // Check X-Forwarded-For first (common for proxies/load balancers)
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded;
            // Take the first IP in the chain (original client)
            const ip = forwardedStr.split(',')[0].trim();
            if (ip) return ip;
        }

        // Check X-Real-IP (nginx)
        const realIp = req.headers['x-real-ip'];
        if (realIp) {
            return Array.isArray(realIp) ? realIp[0] : realIp;
        }

        // Fall back to socket remote address
        return req.socket?.remoteAddress || '127.0.0.1';
    }

    /**
     * Clear the cache (useful for testing)
     */
    clearCache(): void {
        this.cache.clear();
    }
}

// Export singleton instance
export const geoLocationService = new GeoLocationService();
export default geoLocationService;
