Why don't we already do online voting? I know that technology is susceptible to attacks, but we have some pretty solid cryptography already. We could use asymmetric encryption to solve the issue of one vote per person, verifying that the vote was made by the person who owned the private key, and not expose who they voted for.

Imagine that instead of (or alongside) mail-in voting where we mail ballots to people, that voters could opt-in to receiving a YubiKey that was tied to their SSN or some other identifier and use that to vote. The process could go like this:
- The voter would receive the YubiKey in the mail or pick it up at their nearest official place to get one.
- When it comes time to vote, they would go to an official government site and activate the YubiKey, verifying their identity with SSN or driver's license or something else.
- Once the key is activated, it has a public key tied to the person, and can be used to vote once. After it's used to vote, its key will be rejected in further attempts to vote so it can't be reused.
- When the key is used to vote, the identity of the user isn't sent, just the vote increment. ==This is the part of the idea that I think needs work, being able to provably increment the vote count and having the increment be valid without leaking the user's identity. Or we could just be ok with public voting as a society.==
- Afterwards, the user can return the YubiKey via mail or drop off, and the key can be reset and reused in the future.

This way, people can securely vote online, ensuring that one person only votes once (we'd need some sort of infrastructure to prevent voting by both paper ballot and online), and the identity of the voter can't be tied to who/what they voted for.