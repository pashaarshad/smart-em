// SHRESHTA 2026 - Seshadripuram Degree College, Mysuru
// Event Date: 17th February 2026 (Tuesday)

export interface Event {
    id: string;
    title: string;
    titleKannada?: string;
    description: string;
    longDescription: string;
    coordinator: string;
    coordinatorPhone: string;
    category: "it" | "management" | "cultural" | "sports";
    date: string;
    time: string;
    venue: string;
    image: string;
    rules: string[];
    prizes?: {
        first: string;
        second: string;
        third: string;
    };
    teamSize: string;
    registrationFee: string;
}

// ============ MANAGEMENT EVENTS ============
export const managementEvents: Event[] = [
    {
        id: "dhurandharah",
        title: "DHURANDHARAH",
        description: "Entrepreneurship-based event focusing on creativity & decision-making",
        longDescription: "Entrepreneurship-based event focusing on creativity & decision-making. Test your business acumen and strategic thinking.",
        coordinator: "Priya M R",
        coordinatorPhone: "9972672012",
        category: "management",
        date: "Feb 17, 2026",
        time: "8:30 AM",
        venue: "SDC Campus",
        image: "/Best Manager.jpeg",
        rules: [
            "Team of 2 members",
            "College ID is mandatory",
            "Register on or before 15th February 2026",
            "Judges decision will be considered as final",
        ],
        teamSize: "2 Members",
        registrationFee: "₹300/Team",
    },
    {
        id: "samanvaya",
        title: "SAMANVAYA",
        description: "HR & people management event (teamwork, leadership, communication)",
        longDescription: "HR & people management event focusing on teamwork, leadership, and communication skills.",
        coordinator: "Ranjitha N",
        coordinatorPhone: "6362120827",
        category: "management",
        date: "Feb 17, 2026",
        time: "8:30 AM",
        venue: "SDC Campus",
        image: "/hr_logo.jpeg",
        rules: [
            "Team of 2 members",
            "College ID is mandatory",
            "Register on or before 15th February 2026",
            "Judges decision will be considered as final",
        ],
        teamSize: "2 Members",
        registrationFee: "₹300/Team",
    },
    {
        id: "arthasangram",
        title: "ARTHASANGRAM",
        description: "Finance & strategy competition",
        longDescription: "Finance & strategy competition testing your ability to manage resources and make smart financial decisions.",
        coordinator: "Prajwal S",
        coordinatorPhone: "9343537050",
        category: "management",
        date: "Feb 17, 2026",
        time: "8:30 AM",
        venue: "SDC Campus",
        image: "/ARTHASANGRAM.jpeg",
        rules: [
            "Team of 2 members",
            "College ID is mandatory",
            "Register on or before 15th February 2026",
            "Judges decision will be considered as final",
        ],
        teamSize: "2 Members",
        registrationFee: "₹300/Team",
    },
    {
        id: "vikraya",
        title: "VIKRAYA",
        description: "Marketing & business acumen event",
        longDescription: "Marketing & business acumen event. Showcase your innovative marketing ideas and strategy.",
        coordinator: "Adheena Jojo",
        coordinatorPhone: "9902630615",
        category: "management",
        date: "Feb 17, 2026",
        time: "8:30 AM",
        venue: "SDC Campus",
        image: "/Marketing logo.jpeg",
        rules: [
            "Team of 2 members",
            "College ID is mandatory",
            "Register on or before 15th February 2026",
            "Judges decision will be considered as final",
        ],
        teamSize: "2 Members",
        registrationFee: "₹300/Team",
    },
];

// ============ IT EVENTS ============
export const itEvents: Event[] = [
    {
        id: "logic-overload",
        title: "LOGIC OVERLOAD",
        description: "Logic, Pattern, DSA, Web & AI coding contest",
        longDescription: "Logic, Pattern, DSA, Web & AI coding contest. Solve complex problems and debug code to win.",
        coordinator: "Arshad Pasha",
        coordinatorPhone: "7760554350",
        category: "it",
        date: "Feb 17, 2026",
        time: "8:30 AM",
        venue: "Computer Lab",
        image: "/Logic Overload.jpeg",
        rules: [
            "Team of 2 members",
            "College ID is mandatory",
            "Register on or before 15th February 2026",
            "Judges decision will be considered as final",
        ],
        teamSize: "2 Members",
        registrationFee: "₹200/Team",
    },
    {
        id: "pratyaya",
        title: "PRATYAYA",
        description: "UI/UX design & creativity challenge",
        longDescription: "UI/UX design & creativity challenge. Showcase your design thinking and user experience skills.",
        coordinator: "Kruthika B",
        coordinatorPhone: "7892826828",
        category: "it",
        date: "Feb 17, 2026",
        time: "8:30 AM",
        venue: "Computer Lab",
        image: "/UI/UX event.jpeg",
        rules: [
            "Team of 2 members",
            "College ID is mandatory",
            "Register on or before 15th February 2026",
            "Judges decision will be considered as final",
        ],
        teamSize: "2 Members",
        registrationFee: "₹200/Team",
    },

    {
        id: "nidhi-anveshanam",
        title: "NIDHI ANVESHANAM",
        description: "Shadow Fight & clue-based hunt",
        longDescription: "Shadow Fight & clue-based hunt. Solve puzzles and find the treasure to win.",
        coordinator: "T L Sinchana",
        coordinatorPhone: "9845882275",
        category: "it",
        date: "Feb 17, 2026",
        time: "8:30 AM",
        venue: "SDC Campus",
        image: "/nidhi_anveshanam_final.png",
        rules: [
            "Team of 4 members",
            "College ID is mandatory",
            "Register on or before 15th February 2026",
            "Judges decision will be considered as final",
        ],
        teamSize: "4 Members",
        registrationFee: "₹500/Team",
    },
    {
        id: "e-sports",
        title: "E-SPORTS",
        description: "Battle survival game",
        longDescription: "Battle survival game. Compete against other teams in an intense gaming showdown.",
        coordinator: "Hari Kiran",
        coordinatorPhone: "9591047558",
        category: "it",
        date: "Feb 17, 2026",
        time: "8:30 AM",
        venue: "IT Lab",
        image: "/e-sports.jpeg",
        rules: [
            "Team of 4 members",
            "College ID is mandatory",
            "Register on or before 15th February 2026",
            "Judges decision will be considered as final",
        ],
        teamSize: "4 Members",
        registrationFee: "₹500/Team",
    },
];

// ============ CULTURAL EVENTS ============
export const culturalEvents: Event[] = [
    {
        id: "lasyagathi",
        title: "LASYAGATHI",
        description: "Fashion ramp walk event",
        longDescription: "Fashion ramp walk event. Walk the ramp with style and confidence.",
        coordinator: "Poornima M",
        coordinatorPhone: "8217787905",
        category: "cultural",
        date: "Feb 17, 2026",
        time: "8:30 AM",
        venue: "Main Stage",
        image: "/Rampwalk_new.png",
        rules: [
            "Team participation",
            "College ID is mandatory",
            "Register on or before 15th February 2026",
            "Judges decision will be considered as final",
        ],
        teamSize: "Team",
        registrationFee: "₹900/Team",
    },
    {
        id: "lasya-tandava",
        title: "LASYA TANDAVA",
        description: "Solo freestyle dance",
        longDescription: "Solo freestyle dance. Express yourself through dance.",
        coordinator: "Aishwarya",
        coordinatorPhone: "7892984853",
        category: "cultural",
        date: "Feb 17, 2026",
        time: "8:30 AM",
        venue: "Main Stage",
        image: "/sance_solo.jpeg",
        rules: [
            "Individual participation",
            "College ID is mandatory",
            "Register on or before 15th February 2026",
            "Judges decision will be considered as final",
        ],
        teamSize: "1 Person",
        registrationFee: "₹200/Person",
    },
    {
        id: "swara-madurya",
        title: "SWARA MADURYA",
        description: "Solo & group singing competition",
        longDescription: "Solo & group singing competition. Showcase your vocal talents.",
        coordinator: "Poorvi H",
        coordinatorPhone: "9380327667",
        category: "cultural",
        date: "Feb 17, 2026",
        time: "8:30 AM",
        venue: "Open Air Theatre",
        image: "/singin.jpeg",
        rules: [
            "Solo or Group participation",
            "College ID is mandatory",
            "Register on or before 15th February 2026",
            "Judges decision will be considered as final",
        ],
        teamSize: "Solo/Group",
        registrationFee: "Solo: ₹150 | Group: ₹400",
    },
    {
        id: "drushyavahini",
        title: "DRUSHYAVAHINI",
        description: "Videography & storytelling challenge",
        longDescription: "Videography & storytelling challenge. Capture moments and tell stories through your lens.",
        coordinator: "Kowshik",
        coordinatorPhone: "7259607095",
        category: "cultural",
        date: "Feb 17, 2026",
        time: "8:30 AM",
        venue: "SDC Campus",
        image: "/Video graphy logo.jpeg",
        rules: [
            "Individual participation",
            "College ID is mandatory",
            "Register on or before 15th February 2026",
            "Judges decision will be considered as final",
        ],
        teamSize: "1 Person",
        registrationFee: "₹200",
    },
];

// ============ SPORTS EVENTS ============
export const sportsEvents: Event[] = [
    {
        id: "dandashataka",
        title: "DANDASHATAKA",
        description: "30-meter yards cricket",
        longDescription: "30-meter yards cricket. Fast-paced cricket action.",
        coordinator: "Puneeth S",
        coordinatorPhone: "7676380741",
        category: "sports",
        date: "Feb 17, 2026",
        time: "8:30 AM",
        venue: "College Ground",
        image: "/Cricket.jpeg",
        rules: [
            "Team of 8 + 2 players",
            "College ID is mandatory",
            "Register on or before 15th February 2026",
            "Judges decision will be considered as final",
        ],
        teamSize: "8 + 2 Players",
        registrationFee: "₹1000/Team",
    },
];

// All events combined
export const allEvents = [
    ...itEvents,
    ...managementEvents,
    ...culturalEvents,
    ...sportsEvents,
];

export const getEventById = (id: string): Event | undefined => {
    return allEvents.find((event) => event.id === id);
};

export const getEventsByCategory = (category: string): Event[] => {
    return allEvents.filter((event) => event.category === category);
};

// College Information
export const collegeInfo = {
    name: "Seshadripuram Degree College",
    shortName: "SDC",
    location: "Mysuru",
    eventName: "SHRESHTA",
    eventYear: "2026",
    eventDate: "17th February 2026",
    eventDay: "Tuesday",
    reportingTime: "8:30 AM onwards",
    registrationDeadline: "15th February 2026",
    address: "#25, Hebbal Ring Road, Hebbal, Mysuru–570017",
    phone: "+91 96119 81857",
    website: "https://www.sdcmysore.ac.in",
    affiliations: [
        "Permanently Affiliated to the University of Mysore",
        "College Code: 1082",
        "ISO 9001:2015 Certified",
        "NAAC Accredited 'B++' Grade",
        "Approved by AICTE",
        "Recognized by UGC Under 2(f)",
    ],
    programs: ["BCOM", "BBA", "BCA", "MBA"],
    trust: "SESHADRIPURAM EDUCATIONAL TRUST",
};

// Faculty Coordinators
export const facultyCoordinators = [
    { name: "Mrs. Shreedevi N Prabhu", phone: "94483 47273" },
    { name: "Mr. Rudresh Y R", phone: "99865 80226" },
];

// Student Council
export const studentCouncil = [
    { role: "President", name: "T K Hem Changappa", phone: "7259498776" },
    { role: "Secretary", name: "Veekshi B D", phone: "8971366017" },
    { role: "Cultural Secretary", name: "Murali Krishna", phone: "9113903097" },
    { role: "Sports Secretary", name: "Darshan B R", phone: "9980748518" },
];

// Student Coordinators
export const studentCoordinators = {
    management: [
        { name: "Keerthi L.C", phone: "7019037574" },
        { name: "Lisha S", phone: "7349602247" },
        { name: "Deeksha K U", phone: "6363148937" },
        { name: "Gaurav Vasisth", phone: "9483370324" },
    ],
    it: [
        { name: "Mayur G Naidu", phone: "6361400070" },
        { name: "Puneeth", phone: "7676380741" },
        { name: "Keerthana T", phone: "6366268572" },
        { name: "Deepak C G", phone: "6363214067" },
    ],
};
