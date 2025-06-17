import { Credential } from '../types/tracking';

// Generate random date between start and end
const randomDate = (start: Date, end: Date): string => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
};

// Generate random status
const randomStatus = (): string => {
  const statuses = ['inProgress', 'completed', 'notStarted'];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

// Generate random notes
const randomNotes = (): string => {
  const notes = [
    'Application under review',
    'Documents received and being processed',
    'Background check in progress',
    'Medical examination required',
    'Additional documents requested',
    'Application approved',
    'Application rejected due to incomplete information'
  ];
  return notes[Math.floor(Math.random() * notes.length)];
};

// Generate demo credentials
export const generateDemoCredentials = (): Credential[] => {
  const credentials: Credential[] = [];
  const now = new Date();
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < 3; i++) {
    const lastChecked = randomDate(oneMonthAgo, now);
    const applicationNumber = `C${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}`;
    const uci = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    
    credentials.push({
      id: `demo-${i + 1}`,
      user_id: 'demo-user',
      ircc_username: `demo_user_${i + 1}`,
      email: `demo${i + 1}@example.com`,
      is_active: Math.random() > 0.3, // 70% chance of being active
      last_status: 'inProgress',
      last_checked: lastChecked,
      last_timestamp: lastChecked,
      application_number: applicationNumber,
      details: {
        actions: [],
        activities: [
          {
            activity: 'language',
            order: 1,
            status: 'inProgress'
          },
          {
            activity: 'backgroundVerification',
            order: 2,
            status: 'completed'
          },
          {
            activity: 'residency',
            order: 3,
            status: 'inProgress'
          },
          {
            activity: 'prohibitions',
            order: 4,
            status: 'inProgress'
          },
          {
            activity: 'citizenshipTest',
            order: 5,
            status: 'completed'
          },
          {
            activity: 'citizenshipOath',
            order: 6,
            status: 'notStarted'
          }
        ],
        applicationNumber: applicationNumber,
        createdAt: new Date(randomDate(oneMonthAgo, now)).toUTCString(),
        history: [
          {
            activity: '',
            isNew: false,
            isWaiting: false,
            loadTime: Date.now(),
            text: {
              en: 'We have received your application and have begun to process your application. Information about next steps and required action items will be coming soon.',
              fr: 'Nous avons reçu votre candidature et avons commencé à traiter votre candidature. Des informations sur les prochaines étapes et les actions requises seront bientôt disponibles.'
            },
            time: new Date(randomDate(oneMonthAgo, now)).getTime(),
            title: {
              en: 'Application filed',
              fr: 'Demande déposée'
            },
            type: 'fileCreated'
          },
          {
            activity: 'backgroundVerification',
            isNew: null,
            isWaiting: null,
            loadTime: Date.now(),
            text: {
              en: 'Background verification status has been updated to Completed.',
              fr: 'L\'état Vérification des antécédents a été changé pour Terminé.'
            },
            time: new Date(randomDate(oneMonthAgo, now)).getTime(),
            title: {
              en: 'Activity status updated: Background verification',
              fr: 'État d\'activité mis à jour: Vérification des antécédents'
            },
            type: 'activity'
          },
          {
            activity: 'citizenshipTest',
            isNew: false,
            isWaiting: false,
            loadTime: Date.now(),
            text: {
              en: 'Citizenship test status has been updated to In progress.',
              fr: 'L\'état Examen pour la citoyenneté a été changé pour En cours.'
            },
            time: new Date(randomDate(oneMonthAgo, now)).getTime(),
            title: {
              en: 'Activity status updated: Citizenship test',
              fr: 'État d\'activité mis à jour: Examen pour la citoyenneté'
            },
            type: 'activity'
          }
        ],
        lastUpdatedTime: Date.now(),
        status: 'inProgress',
        uci: uci,
        updatedAt: new Date().toUTCString()
      }
    });
  }

  return credentials;
}; 