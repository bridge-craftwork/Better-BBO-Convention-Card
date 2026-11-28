// Bridge Classroom's app is on both bridge-classroom.org and .com, and each
// keeps its own sign-in. A card goes to the one the user visits
// (ui/classroomContent.js remembers it under PREFERRED_TLD_KEY, as Fetch does),
// and to .org, the usual one, until they have visited either.

export const PREFERRED_TLD_KEY = 'preferredTld'

export const bridgeClassroomBase = (tld) => `https://bridge-classroom.${tld === 'com' ? 'com' : 'org'}/solo-practice-app/`
