import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

interface DecodedToken {
  uid: string;
  email?: string;
  name?: string;
  [key: string]: any;
}

let publicKeysCache: { [key: string]: string } = {};
let publicKeysCacheTime = 0;
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

async function getPublicKeys(): Promise<{ [key: string]: string }> {
  const now = Date.now();
  
  // Return cached keys if still valid
  if (publicKeysCacheTime && (now - publicKeysCacheTime) < CACHE_DURATION) {
    return publicKeysCache;
  }

  // Fetch new public keys
  const response = await fetch(
    'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch Firebase public keys');
  }

  publicKeysCache = await response.json() as { [key: string]: string };
  publicKeysCacheTime = now;
  
  return publicKeysCache;
}

export async function verifyFirebaseToken(idToken: string): Promise<DecodedToken> {
  // Backend can use FIREBASE_PROJECT_ID or fall back to VITE_ prefixed one if shared
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  
  if (!projectId) {
    throw new Error('Firebase project ID is not configured');
  }

  try {
    // Get public keys
    const publicKeys = await getPublicKeys();

    // Verify the token
    const decoded = await new Promise<DecodedToken>((resolve, reject) => {
      jwt.verify(
        idToken,
        (header, callback) => {
          const kid = header.kid;
          if (!kid || !publicKeys[kid]) {
            return callback(new Error('Invalid key ID'));
          }
          callback(null, publicKeys[kid]);
        },
        {
          algorithms: ['RS256'],
          audience: projectId,
          issuer: `https://securetoken.google.com/${projectId}`,
        },
        (err, decoded) => {
          if (err) {
            reject(err);
          } else {
            resolve(decoded as DecodedToken);
          }
        }
      );
    });

    // Verify additional claims
    if (!decoded.sub || decoded.sub.length === 0) {
      throw new Error('Invalid subject claim');
    }

    // Return verified token data
    return {
      uid: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      ...decoded
    };
  } catch (error) {
    throw new Error(`Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
