import type { Dictionary } from "../translate";

/**
 * Bengali.
 *
 * MACHINE-TRANSLATED, NOT REVIEWED BY A NATIVE SPEAKER. Check the SOS strings,
 * the offline and SMS strings, and the severity words first — those are the
 * lines where a subtly wrong word costs the most.
 */
export const bn: Dictionary = {
  Home: "হোম",
  Report: "রিপোর্ট",
  Alerts: "সতর্কতা",
  Shelter: "আশ্রয়",
  Mine: "আমার",
  Help: "সাহায্য",
  Dashboard: "ড্যাশবোর্ড",
  "Live Alerts": "সরাসরি সতর্কতা",
  "Find Shelter": "আশ্রয় খুঁজুন",
  "My Reports": "আমার রিপোর্ট",
  "Emergency Contacts": "জরুরি যোগাযোগ",
  "Report an Incident": "ঘটনার খবর দিন",

  "Alerts, shelters and teams nearest to where you are":
    "আপনার সবচেয়ে কাছের সতর্কতা, আশ্রয়কেন্দ্র ও দল",
  "Photo, location, severity — filed in under a minute":
    "ছবি, অবস্থান, তীব্রতা — এক মিনিটের কমে জমা",
  "Official warnings within {km} km of you": "আপনার {km} কিমির মধ্যে সরকারি সতর্কতা",
  "Track the status of what you have reported": "আপনি যা জানিয়েছেন তার অবস্থা দেখুন",
  "Tap any number to call directly": "সরাসরি ফোন করতে যেকোনো নম্বরে ট্যাপ করুন",
  "Shelters, teams and supply points on the map": "মানচিত্রে আশ্রয়কেন্দ্র, দল ও সরবরাহকেন্দ্র",
  "Nearest open shelter: {name}, {km} km": "নিকটতম খোলা আশ্রয়কেন্দ্র: {name}, {km} কিমি",

  "SOS — hold to send": "এসওএস — পাঠাতে চেপে ধরে রাখুন",
  "Keep holding…": "ধরে রাখুন…",
  "Sending…": "পাঠানো হচ্ছে…",
  "Send an SOS": "এসওএস পাঠান",
  "Press and hold for just over a second to file a critical report at your location":
    "আপনার অবস্থান থেকে সংকটজনক রিপোর্ট জমা দিতে এক সেকেন্ডের একটু বেশি চেপে ধরে রাখুন",
  "Files a critical report at your location. No description needed.":
    "আপনার অবস্থান থেকে সংকটজনক রিপোর্ট জমা দেয়। কোনো বিবরণ লাগবে না।",
  "Set your location below before sending an SOS.":
    "এসওএস পাঠানোর আগে নিচে আপনার অবস্থান ঠিক করুন।",
  "SOS sent": "এসওএস পাঠানো হয়েছে",
  "SOS saved offline": "এসওএস অফলাইনে সংরক্ষিত",
  "SOS could not be saved": "এসওএস সংরক্ষণ করা যায়নি",
  "Try again, or call 112.": "আবার চেষ্টা করুন, বা ১১২-এ ফোন করুন।",
  "Authorities have been notified of your location.":
    "কর্তৃপক্ষকে আপনার অবস্থান জানানো হয়েছে।",
  "No connection right now. It will send automatically when you are back online. If you can, call 112.":
    "এখন কোনো সংযোগ নেই। অনলাইনে ফিরলেই এটি নিজে থেকে পাঠানো হবে। পারলে ১১২-এ ফোন করুন।",

  Location: "অবস্থান",
  Severity: "তীব্রতা",
  Description: "বিবরণ",
  "Photo (optional)": "ছবি (ঐচ্ছিক)",
  "Take a photo": "ছবি তুলুন",
  "Choose existing": "আগের ছবি বাছুন",
  "Submit Report": "রিপোর্ট পাঠান",
  "What's happening? Who's affected?": "কী ঘটছে? কারা ক্ষতিগ্রস্ত?",
  "Location required": "অবস্থান প্রয়োজন",
  "Tag your location before submitting.": "পাঠানোর আগে আপনার অবস্থান দিন।",
  "Report submitted": "রিপোর্ট পাঠানো হয়েছে",
  "Authorities have been notified.": "কর্তৃপক্ষকে জানানো হয়েছে।",
  "Authorities have been notified. Your photo could not be uploaded.":
    "কর্তৃপক্ষকে জানানো হয়েছে। আপনার ছবিটি আপলোড করা যায়নি।",
  "Could not save your report": "আপনার রিপোর্ট সংরক্ষণ করা যায়নি",
  "Please try again.": "অনুগ্রহ করে আবার চেষ্টা করুন।",
  "Camera permission needed": "ক্যামেরার অনুমতি প্রয়োজন",
  "Allow camera access to photograph the incident, or choose an existing photo instead.":
    "ঘটনার ছবি তুলতে ক্যামেরার অনুমতি দিন, অথবা আগের কোনো ছবি বাছুন।",
  "Photo permission needed": "ছবির অনুমতি প্রয়োজন",
  "Enable photo access to attach an image.": "ছবি যুক্ত করতে ছবির অনুমতি চালু করুন।",

  "Saved offline": "অফলাইনে সংরক্ষিত",
  "No connection right now. Your report is saved and will be sent automatically when you're back online.":
    "এখন কোনো সংযোগ নেই। আপনার রিপোর্ট সংরক্ষিত হয়েছে এবং অনলাইনে ফিরলেই নিজে থেকে পাঠানো হবে।",
  "1 report waiting to send": "১টি রিপোর্ট পাঠানোর অপেক্ষায়",
  "{count} reports waiting to send": "{count}টি রিপোর্ট পাঠানোর অপেক্ষায়",
  "Saved on this device. They'll upload automatically once you're back online.":
    "এই ডিভাইসে সংরক্ষিত। অনলাইনে ফিরলেই নিজে থেকে আপলোড হয়ে যাবে।",
  "Send by SMS instead": "বদলে এসএমএসে পাঠান",
  "Opens your messages app. Works without mobile data.":
    "আপনার বার্তা অ্যাপ খোলে। মোবাইল ডেটা ছাড়াই কাজ করে।",
  "Send the oldest waiting report as a text message":
    "সবচেয়ে পুরনো অপেক্ষমাণ রিপোর্ট বার্তা হিসেবে পাঠান",
  "Could not open messages": "বার্তা অ্যাপ খোলা যায়নি",
  "Open your messages app and send this to the Aapda Mitra number:":
    "আপনার বার্তা অ্যাপ খুলে এটি আপদা মিত্র নম্বরে পাঠান:",

  "Your position": "আপনার অবস্থান",
  "Finding your location…": "আপনার অবস্থান খোঁজা হচ্ছে…",
  "Use my location": "আমার অবস্থান ব্যবহার করুন",
  "Update location": "অবস্থান হালনাগাদ করুন",
  "Name my place": "আমার জায়গার নাম দিন",
  "Where are you?": "আপনি কোথায়?",
  State: "রাজ্য",
  District: "জেলা",
  "Town or city": "শহর বা নগর",
  "No town is listed here": "এখানে কোনো শহর তালিকাভুক্ত নেই",
  "Search {towns} towns, {districts} districts": "{towns}টি শহর, {districts}টি জেলায় খুঁজুন",
  "Filter {n} towns": "{n}টি শহর ছাঁকুন",
  approximate: "আনুমানিক",
  "approximate, set by hand": "আনুমানিক, হাতে দেওয়া",
  "Location access is turned off for this app. Allow it in Settings, or name your place below.":
    "এই অ্যাপের জন্য অবস্থানের অনুমতি বন্ধ। সেটিংসে চালু করুন, অথবা নিচে আপনার জায়গার নাম দিন।",
  "Location Services is switched off on this device. Turn it on, or name your place below.":
    "এই ডিভাইসে লোকেশন সার্ভিস বন্ধ। এটি চালু করুন, অথবা নিচে আপনার জায়গার নাম দিন।",
  "Your device didn't return a location in time. Moving outdoors often helps.":
    "আপনার ডিভাইস সময়মতো অবস্থান জানায়নি। খোলা জায়গায় গেলে প্রায়ই কাজ হয়।",
  "Location lookup failed. You can name your place instead.":
    "অবস্থান খুঁজে পাওয়া যায়নি। বদলে আপনি আপনার জায়গার নাম দিতে পারেন।",

  "Active alerts within {km} km": "{km} কিমির মধ্যে সক্রিয় সতর্কতা",
  "Most severe: {type}{agency} · {km} away": "সবচেয়ে তীব্র: {type}{agency} · {km} দূরে",
  "No official warnings currently cover your area.":
    "এই মুহূর্তে আপনার এলাকার জন্য কোনো সরকারি সতর্কতা নেই।",
  "Nearest available shelter": "নিকটতম উপলব্ধ আশ্রয়কেন্দ্র",
  "No shelter is currently marked available in the registry.":
    "এই মুহূর্তে নথিতে কোনো আশ্রয়কেন্দ্র উপলব্ধ দেখানো নেই।",
  "Nearest available rescue team": "নিকটতম উপলব্ধ উদ্ধারকারী দল",
  "No rescue team is currently marked available.":
    "এই মুহূর্তে কোনো উদ্ধারকারী দল উপলব্ধ দেখানো নেই।",
  "Your open reports": "আপনার খোলা রিপোর্ট",
  "Still being worked. Track them under My Reports.":
    "এখনও কাজ চলছে। আমার রিপোর্টে এগুলি দেখুন।",
  "Nothing outstanding from you right now.": "এই মুহূর্তে আপনার কিছু বাকি নেই।",
  "None listed": "কিছু নেই",
  "capacity {n}": "ধারণক্ষমতা {n}",
  "No active alerts nearby.": "কাছাকাছি কোনো সক্রিয় সতর্কতা নেই।",
  "You haven't submitted any reports yet.": "আপনি এখনও কোনো রিপোর্ট পাঠাননি।",

  low: "কম",
  medium: "মাঝারি",
  high: "বেশি",
  critical: "সংকটজনক",
  advisory: "পরামর্শ",
  watch: "নজরদারি",
  warning: "সতর্কতা",
  severe: "তীব্র",
  open: "খোলা",
  assigned: "বরাদ্দ",
  resolved: "সমাধান হয়েছে",
  available: "উপলব্ধ",
  full: "পূর্ণ",
  dispatched: "পাঠানো হয়েছে",
  shelter: "আশ্রয়কেন্দ্র",
  "rescue team": "উদ্ধারকারী দল",
  "supply stock": "সরবরাহ ভাণ্ডার",
  Open: "খোলা",
  Full: "পূর্ণ",
  "Out on a call": "ডাকে বেরিয়েছে",

  "National Emergency Number": "জাতীয় জরুরি নম্বর",
  Police: "পুলিশ",
  Fire: "দমকল",
  Ambulance: "অ্যাম্বুলেন্স",
  "NDMA Disaster Management Helpline": "এনডিএমএ দুর্যোগ ব্যবস্থাপনা হেল্পলাইন",
  "Women's Helpline": "মহিলা হেল্পলাইন",
  "Call {name} on {number}": "{name}-কে {number} নম্বরে ফোন করুন",

  Close: "বন্ধ করুন",
  Change: "বদলান",
  "Change language": "ভাষা বদলান",
  "Choose your language": "আপনার ভাষা বাছুন",

  // Strings the citizen web view has and the app does not.
  "Sign out": "সাইন আউট",
  "Try again": "আবার চেষ্টা করুন",
  "Submitting…": "পাঠানো হচ্ছে…",
  "Hide place list": "জায়গার তালিকা লুকান",
  "Attached photo preview": "যুক্ত করা ছবির প্রাকদর্শন",
  "Search for your city or district": "আপনার শহর বা জেলা খুঁজুন",
  "Search {cities} cities, {districts} districts…":
    "{cities}টি শহর, {districts}টি জেলায় খুঁজুন…",
  "Filter {n} towns…": "{n}টি শহর ছাঁকুন…",
  "Location not available yet — allow location access and try again.":
    "অবস্থান এখনও পাওয়া যায়নি — অবস্থানের অনুমতি দিন এবং আবার চেষ্টা করুন।",
  "Set your location first — use the readout above.":
    "আগে আপনার অবস্থান ঠিক করুন — উপরের তথ্যটি ব্যবহার করুন।",
  "Report submitted. Authorities have been notified.":
    "রিপোর্ট পাঠানো হয়েছে। কর্তৃপক্ষকে জানানো হয়েছে।",
  "Official warnings near you, updated continuously":
    "আপনার কাছাকাছি সরকারি সতর্কতা, নিয়মিত হালনাগাদ",
  "Nearest shelters and resources on the map": "মানচিত্রে নিকটতম আশ্রয়কেন্দ্র ও সম্পদ",
  "Fire, police, ambulance, disaster helplines": "দমকল, পুলিশ, অ্যাম্বুলেন্স, দুর্যোগ হেল্পলাইন",
  "This site is blocked from using your location.":
    "এই সাইটকে আপনার অবস্থান ব্যবহার করতে দেওয়া হয়নি।",
  "Allow location for this site in your browser settings, then try again — or just name your place below.":
    "আপনার ব্রাউজারের সেটিংসে এই সাইটের জন্য অবস্থানের অনুমতি দিন, তারপর আবার চেষ্টা করুন — অথবা নিচে আপনার জায়গার নাম দিন।",
  "Your device didn't return a location in time.": "আপনার ডিভাইস সময়মতো অবস্থান জানায়নি।",
  "Moving outdoors usually helps, or name your place below.":
    "খোলা জায়গায় গেলে সাধারণত কাজ হয়, অথবা নিচে আপনার জায়গার নাম দিন।",
  "Your device couldn't determine a location.": "আপনার ডিভাইস অবস্থান নির্ধারণ করতে পারেনি।",
  "Common on a desktop with no GPS, and on a phone with Location Services switched off. Name your place below instead.":
    "জিপিএস ছাড়া কম্পিউটারে এবং লোকেশন সার্ভিস বন্ধ থাকা ফোনে এটি সাধারণ। বদলে নিচে আপনার জায়গার নাম দিন।",
  "This browser doesn't support location lookup.": "এই ব্রাউজার অবস্থান খোঁজা সমর্থন করে না।",
  "Name your place below instead.": "বদলে নিচে আপনার জায়গার নাম দিন।",
  "This page is not on a secure (https) connection, so the browser will not share your location.":
    "এই পৃষ্ঠাটি নিরাপদ (https) সংযোগে নেই, তাই ব্রাউজার আপনার অবস্থান জানাবে না।",
  "Open the deployed https site, or name your place below.":
    "https সাইটটি খুলুন, অথবা নিচে আপনার জায়গার নাম দিন।",

  // Strings the citizen web view has and the app does not.
  "Hospitals": "হাসপাতাল",
  "Police stations": "থানা",
  "Fire stations": "দমকল কেন্দ্র",
  "Zoom in to see facilities": "সুবিধা দেখতে জুম করুন",
  "None nearby": "কাছাকাছি কিছু নেই",
  "Showing {shown} of {total}": "{total}-এর মধ্যে {shown} দেখানো হচ্ছে",
  "{n} nearby": "কাছাকাছি {n}",
  "Could not load facilities": "সুবিধা লোড করা যায়নি",
};
