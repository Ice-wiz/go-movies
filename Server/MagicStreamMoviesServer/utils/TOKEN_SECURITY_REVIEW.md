# Critical Security Review: Token Storage Architecture

## Executive Summary

**Current Approach**: Storing both access tokens and refresh tokens in the database in plain text.

**Verdict**: ⚠️ **ACCEPTABLE FOR SMALL APPS ONLY** - Has significant security and scalability limitations.

---

## 1. Should Access Tokens Be Stored in Database?

### ❌ **NO - Not Recommended for Production**

**Reasons:**

1. **Defeats JWT Purpose**: JWTs are designed to be **stateless**. Storing them in DB makes them stateful, requiring DB lookup on every request.

2. **Performance Impact**: Every authenticated request requires a database query to check token validity, eliminating JWT's main advantage (stateless validation).

3. **Scalability Issues**: 
   - Database becomes a bottleneck
   - Can't easily scale horizontally (need shared DB or session store)
   - Adds latency to every request

4. **Unnecessary Complexity**: If you need to check DB anyway, why use JWT? Use session tokens instead.

### ✅ **Exception: Token Blacklisting**

Access tokens **should** be stored ONLY if implementing:
- **Token blacklisting** (logout/invalidation)
- **Token revocation** (security breach, password change)

But even then, use a **separate token blacklist/whitelist** (Redis, in-memory cache), not the user document.

---

## 2. Security Risks with Current Design

### 🔴 **Critical Risks**

#### **1. Database Breach = Complete Compromise**
- **Risk**: If database is breached, attacker gets ALL active tokens (plain text)
- **Impact**: Can impersonate any user until tokens expire
- **Severity**: CRITICAL

#### **2. Token Theft via Database**
- **Risk**: Anyone with DB access (admin, compromised account, SQL injection) can steal tokens
- **Impact**: Immediate unauthorized access
- **Severity**: HIGH

#### **3. No Token Rotation**
- **Risk**: Refresh tokens never change, can be reused indefinitely until expiration
- **Impact**: Stolen refresh token works for 7 days
- **Severity**: HIGH

#### **4. Race Conditions**
- **Risk**: Multiple simultaneous refresh requests can create duplicate valid tokens
- **Impact**: Token confusion, potential security issues
- **Severity**: MEDIUM

#### **5. Replay Attacks**
- **Risk**: Old tokens remain valid until expiration (no revocation mechanism)
- **Impact**: Stolen token works until it expires (24h for access, 7 days for refresh)
- **Severity**: MEDIUM

#### **6. Plain Text Storage**
- **Risk**: Tokens stored in plain text (no hashing)
- **Impact**: Direct exposure if DB is compromised
- **Severity**: HIGH

---

## 3. Better Architecture Proposal

### **Recommended: Hybrid Approach**

#### **Access Tokens: Stateless (Not Stored)**
- ✅ Short-lived (15-60 minutes, not 24 hours)
- ✅ Validated via signature only (no DB lookup)
- ✅ Blacklisted on logout (optional, use Redis)
- ✅ Stateless = scalable, fast

#### **Refresh Tokens: Stateful (Stored Securely)**
- ✅ Long-lived (7-30 days)
- ✅ **HASHED** in database (bcrypt/argon2)
- ✅ Stored in separate `refresh_tokens` collection
- ✅ Include metadata: `user_id`, `created_at`, `expires_at`, `last_used_at`
- ✅ **Token rotation**: New refresh token invalidates old one
- ✅ **Family tracking**: Detect token theft (multiple refresh tokens = suspicious)

---

## 4. Revised Implementation

### **Option A: Production-Grade (Recommended)**

```go
// Refresh token structure
type RefreshToken struct {
    ID          bson.ObjectID `bson:"_id,omitempty"`
    UserID      string        `bson:"user_id"`
    TokenHash   string        `bson:"token_hash"`      // Hashed token
    CreatedAt   time.Time     `bson:"created_at"`
    ExpiresAt   time.Time     `bson:"expires_at"`
    LastUsedAt  time.Time     `bson:"last_used_at"`
    FamilyID    string        `bson:"family_id"`       // For rotation tracking
    Revoked     bool          `bson:"revoked"`
}

// Store refresh token (HASHED)
func StoreRefreshToken(userId, refreshToken string, client *mongo.Client) error {
    // Hash the token before storing
    hashedToken, err := bcrypt.GenerateFromPassword([]byte(refreshToken), bcrypt.DefaultCost)
    if err != nil {
        return err
    }
    
    tokenDoc := RefreshToken{
        UserID:     userId,
        TokenHash:  string(hashedToken),
        CreatedAt:  time.Now(),
        ExpiresAt:  time.Now().Add(7 * 24 * time.Hour),
        LastUsedAt: time.Now(),
        FamilyID:   generateFamilyID(), // For rotation
        Revoked:    false,
    }
    
    collection := database.OpenCollection("refresh_tokens", client)
    _, err = collection.InsertOne(context.Background(), tokenDoc)
    return err
}

// Validate refresh token (with rotation)
func ValidateAndRotateRefreshToken(tokenString string, client *mongo.Client) (*SignedDetails, string, error) {
    // 1. Validate token signature
    claims, err := ValidateRefreshToken(tokenString)
    if err != nil {
        return nil, "", err
    }
    
    // 2. Find token in database (by user_id, check all tokens for that user)
    collection := database.OpenCollection("refresh_tokens", client)
    filter := bson.M{"user_id": claims.UserId, "revoked": false}
    
    cursor, err := collection.Find(context.Background(), filter)
    if err != nil {
        return nil, "", err
    }
    defer cursor.Close(context.Background())
    
    var tokens []RefreshToken
    cursor.All(context.Background(), &tokens)
    
    // 3. Check if any token hash matches
    var foundToken *RefreshToken
    for _, token := range tokens {
        if bcrypt.CompareHashAndPassword([]byte(token.TokenHash), []byte(tokenString)) == nil {
            // Check expiration
            if time.Now().After(token.ExpiresAt) {
                return nil, "", errors.New("refresh token expired")
            }
            foundToken = &token
            break
        }
    }
    
    if foundToken == nil {
        return nil, "", errors.New("refresh token not found or invalid")
    }
    
    // 4. REVOKE old token (token rotation)
    collection.UpdateOne(
        context.Background(),
        bson.M{"_id": foundToken.ID},
        bson.M{"$set": bson.M{"revoked": true}},
    )
    
    // 5. Generate new token pair
    user := getUserById(claims.UserId, client) // Helper function
    newAccessToken, newRefreshToken, err := GenerateAllTokens(user)
    if err != nil {
        return nil, "", err
    }
    
    // 6. Store new refresh token
    err = StoreRefreshToken(claims.UserId, newRefreshToken, client)
    if err != nil {
        return nil, "", err
    }
    
    // 7. Update last_used_at
    collection.UpdateOne(
        context.Background(),
        bson.M{"_id": foundToken.ID},
        bson.M{"$set": bson.M{"last_used_at": time.Now()}},
    )
    
    return claims, newRefreshToken, nil
}

// Logout: Revoke all refresh tokens for user
func RevokeAllRefreshTokens(userId string, client *mongo.Client) error {
    collection := database.OpenCollection("refresh_tokens", client)
    _, err := collection.UpdateMany(
        context.Background(),
        bson.M{"user_id": userId, "revoked": false},
        bson.M{"$set": bson.M{"revoked": true}},
    )
    return err
}
```

### **Option B: Simplified (For Small Apps)**

If you must keep current approach, at minimum:

```go
func UpdateAllTokens(userId, accessToken, refreshToken string, client *mongo.Client) error {
    ctx, cancel := context.WithTimeout(context.Background(), 100*time.Second)
    defer cancel()
    
    // HASH the refresh token (access token not stored)
    hashedRefresh, err := bcrypt.GenerateFromPassword([]byte(refreshToken), bcrypt.DefaultCost)
    if err != nil {
        return err
    }
    
    updateData := bson.M{
        "$set": bson.M{
            // DON'T store access token - it's stateless
            "refresh_token_hash": string(hashedRefresh), // Hashed!
            "updated_at":         time.Now(),
        },
    }
    
    userCollection := database.OpenCollection("users", client)
    _, err = userCollection.UpdateOne(ctx, bson.M{"user_id": userId}, updateData)
    return err
}
```

**Changes:**
- ❌ Remove access token storage
- ✅ Hash refresh token
- ✅ Access token validated statelessly (signature only)

---

## 5. Token Storage Strategy

### **What Should Be Stored?**

| Token Type | Store? | How? | Why? |
|------------|--------|------|------|
| **Access Token** | ❌ NO | Not stored | Stateless validation |
| **Refresh Token** | ✅ YES | **Hashed** in separate collection | Security, revocation, rotation |

### **Should Tokens Be Hashed?**

**Refresh Tokens: YES** ✅
- Use bcrypt or argon2
- Prevents direct exposure if DB breached
- One-way hash (can't reverse)

**Access Tokens: N/A** (not stored)

### **Logout Strategy**

1. **Access Token**: 
   - Client deletes cookie
   - Optional: Add to Redis blacklist (TTL = token expiration)
   - No DB operation needed

2. **Refresh Token**:
   - Revoke in database (`revoked: true`)
   - Or delete from `refresh_tokens` collection
   - Prevents future token refresh

### **Refresh Token Rotation**

**How it works:**
1. User sends refresh token
2. Validate token signature
3. Check token exists in DB (hashed comparison)
4. **Revoke old token** (mark as used/revoked)
5. Generate new token pair
6. Store new refresh token
7. Return new tokens

**Benefits:**
- ✅ Stolen token can only be used once
- ✅ Detects token theft (old token used after new one issued)
- ✅ Limits damage window

---

## 6. Scalability Limits of Current Approach

### **When Current Design is Acceptable:**

✅ **Small Apps** (< 1000 users)
✅ **Low Traffic** (< 100 req/sec)
✅ **Single Server** (no horizontal scaling needed)
✅ **Internal Tools** (lower security requirements)

### **When to Upgrade:**

❌ **High Traffic** (> 1000 req/sec)
❌ **Multiple Servers** (need shared state)
❌ **Production Apps** (security critical)
❌ **Large User Base** (> 10,000 users)

---

## 7. Recommended Implementation for This Project

Given this is a learning project that may scale, I recommend **Option B (Simplified)** as a minimum:

1. **Remove access token storage** (make it stateless)
2. **Hash refresh tokens** (security)
3. **Keep refresh token in user document** (simpler for now)
4. **Add token rotation** (when ready)

This provides:
- ✅ Better security than current
- ✅ Maintains simplicity
- ✅ Easy to upgrade later

---

## 8. Migration Path

**Phase 1 (Now)**: Remove access token storage, hash refresh tokens
**Phase 2 (Later)**: Move refresh tokens to separate collection
**Phase 3 (Scale)**: Add token rotation, family tracking
**Phase 4 (Enterprise)**: Redis blacklist for access tokens, advanced monitoring

---

## Summary

**Current Design**: ⚠️ Acceptable for small apps, but has security flaws

**Key Issues**:
- Access tokens shouldn't be stored (defeats JWT purpose)
- Refresh tokens stored in plain text (security risk)
- No token rotation (stolen tokens work until expiration)

**Minimum Fix**:
- Remove access token storage
- Hash refresh tokens
- Keep current structure (can upgrade later)

**Production Fix**:
- Separate refresh token collection
- Token rotation
- Family tracking
- Redis blacklist for access tokens (optional)

