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
			en: "Merci, votre message a été envoyé.",
			fr: "Your message has been sent.",
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
	ProjectCard: {
		websiteLink: {
			en: "Website link",
			fr: "Lien du site web",
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

let lang;
if (navigator.languages !== undefined) lang = navigator.languages[0];
lang = navigator.language;

export function $t(key) {
	const foundKey = key.split(".").reduce((obj, k) => obj?.[k], keys);
	if (lang.startsWith("fr")) {
		return foundKey["fr"];
	} else {
		return foundKey["en"];
	}
	throw new Error("Invalid locale");
}

export function getCvUrl() {
	if (lang.startsWith("fr")) {
		return "/cv-arthur-durand-2026-portfolio.pdf";
	} else {
		return "/cv-arthur-durand-2026-portfolio-en.pdf";
	}
}
