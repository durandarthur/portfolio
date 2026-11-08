import { ref, watch } from "vue";

const keys = {
	ContactForm: {
		errorMsg: {
			en: "Error message",
			fr: "Message d'erreur",
		},
		enterMsg: {
			en: "Enter your message",
			fr: "Entrez votre message",
		},
		msgSent: {
			en: "Your message has been sent.",
			fr: "Merci, votre message a été envoyé.",
		},
		sender: {
			en: "Sender",
			fr: "Expéditeur",
		},
		mailPlaceholder: {
			en: "yourmail@exemple.com",
			fr: "votremail@exemple.com",
		},
	},
	// FR strings in Taskbar and Notice: translated, to review.
	Taskbar: {
		about: { en: "About Arthur", fr: "À propos d'Arthur" },
		workspaces: { en: "Workspaces", fr: "Espaces de travail" },
		workspace: { en: "Workspace", fr: "Espace de travail" },
		openWindows: { en: "Open windows", fr: "Fenêtres ouvertes" },
		noWindows: { en: "no windows open", fr: "aucune fenêtre ouverte" },
		language: { en: "Language", fr: "Langue" },
	},
	Notice: {
		label: { en: "Welcome", fr: "Bienvenue" },
		kicker: { en: "notification", fr: "notification" },
		dismiss: { en: "Dismiss", fr: "Fermer" },
		title: { en: "Hi, I'm Arthur.", fr: "Bonjour, ici Arthur." },
		text: {
			en: "Short on time? Grab my CV, or click around — everything here opens like a real desktop.",
			fr: "Pressé ? Récupérez mon CV, ou explorez — tout ici s'ouvre comme sur un vrai bureau.",
		},
		openCv: { en: "Open CV", fr: "Ouvrir le CV" },
	},
	ProjectCard: {
		websiteLink: {
			en: "Website link",
			fr: "Lien du site web",
		},
		repoLink: {
			en: "Repository link",
			fr: "Lien du Repo",
		},
	},
	Data: {
		terminalBioQuote: {
			en: `<p>\nHi ! I&apos;m Arthur, Software Developer and tech enthusiast. I help companies reach their goals.</p>`,
			fr: `<p>\nJe m&apos;appelle Arthur. Développeur web passionné des nouvelles technologies, je m&apos;engage à faire avancer les missions des entreprises.</p>`,
		},
		techs: {
			webDev: {
				en: "Web Development",
				fr: "Développement Web",
			},
			tools: {
				en: "Tools",
				fr: "Outils",
			},
			misc: {
				en: "Misc",
				fr: "Autres",
			},
			projectManagement: {
				en: "Project Management",
				fr: "Gestion de projet",
			},
		},
		timeline: {
			february: {
				en: "February",
				fr: "Février",
			},
			march: {
				en: "March",
				fr: "Mars",
			},
			april: {
				en: "April",
				fr: "Avril",
			},
			december: {
				en: "December",
				fr: "Décembre",
			},
			remote: {
				en: "Remote",
				fr: "Télétravail",
			},
			designerDeveloper: {
				en: "Software Designer and Developer",
				fr: "Développeur et Designer Web",
			},
			SWE: {
				en: "Software Engineer",
				fr: "Ingénieur Fullstack",
			},
			kalisioDetail: {
				en: "Vue.js components, Puppeteer tests, Node.js and Feathers.js work on multiple projects for Airbus and the ASNR (nuclear safety).\nUse of a SDK created by the company",
				fr: "Composants Vue.js, tests avec Puppeteer, travail avec Node.js et Feathers.js sur plusieurs projets pour Airbus et l'ASNR.\nUtilisation d'un SDK créé par l'entreprise",
			},
			fuviDetail: {
				en: "Web service for DJs, under NDA.\n • Fullstack development with Vue and Laravel\n • Engineering of AI-based services (design and implementation)\n • Development with AWS SQS and S3 with BOTO3 (Python)",
				fr: "Service web pour DJs, sous contrat de confidentialité.\n • Développement fullstack avec Vue et Laravel\n • Implémentation d'IA\n • Développement AWS SQS et S3 avec BOTO3 (Python)",
			},
			CDA: {
				en: "Software Designer and Developer - O'clock (RNCP level 6 degree)",
				fr: "Concepteur Développeur d'Application (diplômé RNCP n°6)",
			},
			oclock: {
				en: "O'clock, remote training",
				fr: "O'clock, campus en ligne",
			},
			oclockDetail: {
				en: "Curriculum with apprenticeship.\nAcquired skills: Node, React.js, Vue.js, Docker, TDD, websec, design patterns, desktop apps with Flutter, Agile methods",
				fr: "Formation de développeur web en alternance (1 semaine en formation / 2 semaines en entreprise)\nCompétences apprises: PHP, Node, React, conteneurs, unit testing, design patterns, SoC, sécurité, applications bureau, DevOps",
			},
			personalProject: {
				en: "Personal project",
				fr: "Projet personnel",
			},
			gapYear: {
				en: "Gap year for self-teaching",
				fr: "Année de césure",
			},
			personalProjectDetail: {
				en: "Development of a website with React and Next.js. Uses a postgresql database.\nAllows users to post project ideas and to look them up, in similar fashion to a forum.",
				fr: "Développement d'un site web avec React et Next.js, lié à une base de données postgresql avec fonctions CRUD.\nPermet de publier des idées de projet et d'en rechercher d'une façon similaire à un forum.",
			},
			fullstackDev: {
				en: "Fullstack developer",
				fr: "Développeur fullstack",
			},
			creapliDetail: {
				en: "Development of a web application with C# and vanilla JS.\nUsed for financial management by a jewellery retail chain.",
				fr: "J'ai développé une application web (soumise à une clause de confidentalité) en C# et JavaScript utilisée dans la gestion de finances pour une chaîne de bijouteries.",
			},
			bacplustwo: {
				en: "Bac+2 Spécialité informatique",
				fr: "'Bac +2' CS Major",
			},
			cesiEngineeringSchool: {
				en: "CESI Engineering School",
				fr: "CESI Ecole d'Ingénieurs",
			},
			cesiDetail: {
				en: "C/C++, SQL, PHP, data structures, sorting algorithms/algorithm optimization (big O notation)",
				fr: "Formation C/C++, SQL, PHP, structures de données, algorithmes de tri/performance algorithmes",
			},
			bacSti: {
				en: "CS major A level",
				fr: "Baccalauréat STi2D",
			},
			bacDetail: {
				en: "CS Major (Systèmes d'Information et Numérique)",
				fr: "Spécialisation informatique (Systèmes d'Information et Numérique)",
			},
		},
	},
	App: {
		// Desktop icon labels and window titles. FR strings: translated, to review.
		apps: {
			contact: {
				label: { en: "Contact", fr: "Contact" },
				title: { en: "Contact", fr: "Contact" },
			},
			cv: {
				label: { en: "CV.pdf", fr: "CV.pdf" },
				title: { en: "CV.pdf", fr: "CV.pdf" },
			},
			projects: {
				label: { en: "projects/", fr: "projets/" },
				title: { en: "~/projects", fr: "~/projets" },
			},
			terminal: {
				label: { en: "terminal", fr: "terminal" },
				title: { en: "terminal", fr: "terminal" },
			},
			techs: {
				label: { en: "techs/", fr: "technos/" },
				title: { en: "~/techs", fr: "~/technos" },
			},
		},
		desktop: {
			tagline: {
				en: "Fullstack developer — currently building with applied AI.",
				fr: "Développeur fullstack — artisan du virtuel.",
			},
			hintClick: { en: "click", fr: "cliquez" },
			hintOpen: { en: "an icon to open it", fr: "sur une icône pour l'ouvrir" },
			hintType: { en: "or type", fr: "ou tapez" },
			hintTerminal: { en: "in the terminal", fr: "dans le terminal" },
			hoverHint: {
				en: "click to open · ↵ when focused",
				fr: "cliquez pour ouvrir · ↵ au clavier",
			},
			descriptions: {
				contact: { en: "Email contact form.", fr: "Formulaire de contact par mail." },
				cv: { en: "View and download my resume in your browser's PDF viewer.", fr: "Visionnez et téléchargez mon CV dans le visualiseur PDF de votre navigateur." },
				projects: { en: "A list of projects I've built.", fr: "Une liste de projets que j'ai réalisés." },
				terminal: { en: "Interactive terminal.", fr: "Terminal interactif." },
				techs: {
					en: "Stack, tools, and what I'm learning right now.",
					fr: "Stack, outils, et ce que j'apprends en ce moment.",
				},
			},
		},
		contactForm: {
			en: "Contact form",
			fr: "Formulaire de contact",
		},
		myProjects: {
			en: "My Projects",
			fr: "Mes Projets",
		},
		projectsIconLabel: {
			en: "Projects",
			fr: "Projets",
		},
		about: {
			en: "About",
			fr: "À propos",
		},
		ffReworkTitle: {
			en: "Fanfiction.net rework",
			fr: "Refonte de Fanfiction.net",
		},
		ffReworkDetail: {
			en: `A rework of the famous collaborative writing website.
			This project has been built with Adonis.js, React, and Mantine UI.
			It features file downloads, text document to HTML conversion, WebSockets use, 
			SSO with third-party providers, and more.
			The website was deployed on a Hetzner VPS using Docker, nginx, SSL and a Cloudflare domain.`,
			fr: `Une refonte du célèbre site web d'écriture collaborative.
			Ce projet de développement web fullstack a été fait avec Adonis JS,
			React, et Mantine UI. Il comporte le téléchargement de fichiers,
			la conversion de documents Word en HTML, l'utilisation de WebSockets,
			l'authentification unique (SSO), et bien plus encore.
			Déployé sur un VPS Hetzner utilisant Docker, Nginx, SSL et un domaine
			Cloudflare.`,
		},
		stLoungeTitle: {
			en: "ShaderToy Lounge",
			fr: "ShaderToy Lounge",
		},
		stLoungeDetail: {
			en: "ShaderToy Lounge is a Linux shader viewer (C++, OpenGL, open source). It can be installed by compiling the source code, or by downloading the AppImage or FlatPak. The CI/CD managed by GitHub Actions automatically produces the packages.",
			fr: "Lecteur de shaders pour Linux (C++, OpenGL, open source). Installable en compilant le code source, ou en téléchargeant l'AppImage ou le FlatPak. Le CI/CD géré par GitHub Actions produit automatiquement les packages.",
		},
		moreInfo: {
			credits: {
				en: "This project was created thanks to",
				fr: "Ce projet n'aurait pas été possible sans",
			},
			legalNoticeTitle: {
				en: "Legal notice",
				fr: "Mentions légales",
			},
			legalNoticeDetail: {
				en: `No data is collected by this website, except if you decide to send a mail in the contact form.<br />
				This is optional, and is only used in order to recontact you.`,
				fr: `Aucune de vos données ne sont collectées par ce site web, sauf si
				vous décidez d'envoyer votre mail dans le formulaire de contact.<br />
				Ceci est optionnel, et ne sert qu'à vous recontacter.`,
			},
			otherContacts: {
				en: "Other contacts (if the form doesn't work)",
				fr: "Autres contacts (si le formulaire ne marche pas)",
			},
			particlesAmount: {
				en: "Amount of particles (unstable)",
				fr: "Nombre de particules (instable)",
			},
			mouseRadius: {
				en: "Radius of the mouse cursor effect",
				fr: "Rayon de l'effet curseur",
			},
			effectStrength: {
				en: "Strength of the mouse cursor effect",
				fr: "Amplitude de l'effet curseur",
			},
			pleaseReportBugs: {
				en: "Please report any bug found on this website.",
				fr: "Veuillez me signaler tout bug informatique rencontré sur ce site.",
			},
		},
	},
};

// Current language, reactive so the UI re-renders when it changes.
// Saved per browser; defaults to the browser language.
function initialLang() {
	try {
		const saved = localStorage.getItem("lang");
		if (saved === "fr" || saved === "en") return saved;
	} catch {}
	return (navigator.language || "en").startsWith("fr") ? "fr" : "en";
}

export const lang = ref(initialLang());

// Only an explicit choice is saved, so the browser language still applies otherwise
export function setLang(value) {
	lang.value = value === "fr" ? "fr" : "en";
	try {
		localStorage.setItem("lang", lang.value);
	} catch {}
}

watch(lang, (value) => (document.documentElement.lang = value), {
	immediate: true,
});

export function $t(key) {
	const foundKey = key.split(".").reduce((obj, k) => obj?.[k], keys);
	if (!foundKey) throw new Error(`Missing translation: ${key}`);
	return foundKey[lang.value];
}

export function getCvUrl() {
	return lang.value === "fr"
		? "/cv-arthur-durand-2026-portfolio.pdf"
		: "/cv-arthur-durand-2026-portfolio-en.pdf";
}
