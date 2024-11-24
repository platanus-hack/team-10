function generateUserContext(user) {
  // Return empty string for null/undefined user
  if (!user) return '';

  // Destructure with default values to handle missing/null properties
  const {
    name = '',
    age = '',
    gender = 'PREFER_NOT_TO_SAY',
    workStatus = '',
    relationshipStatus = '',
    homeStatus = '',
    sobrietyStartDate
  } = user;

  // Skip context generation if essential fields are empty/null
  if (!name && !age) return '';

  // Calculate sobriety duration if sobrietyStartDate exists
  let sobrietyDuration = '';
  if (sobrietyStartDate) {
    const today = new Date();
    const startDate = new Date(sobrietyStartDate);
    // Only calculate if date is valid and not in the future
    if (!isNaN(startDate) && startDate <= today) {
      const days = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      if (days > 30) {
        const months = Math.floor(days / 30);
        sobrietyDuration = `${months} ${months === 1 ? 'mes' : 'meses'}`;
      } else {
        sobrietyDuration = `${days} ${days === 1 ? 'día' : 'días'}`;
      }
    }
  }

  // Gender-specific pronouns and articles
  const pronouns = {
      MALE: { article: '', pronoun: 'o' },
      FEMALE: { article: 'a', pronoun: 'a' },
      NON_BINARY: { article: 'e', pronoun: 'e' },
      OTHER: { article: 'e', pronoun: 'e' },
      PREFER_NOT_TO_SAY: { article: 'e', pronoun: 'e' }
  };

  const { article, pronoun } = pronouns[gender] || pronouns.PREFER_NOT_TO_SAY;

  // Work status mapping
  const workStatusText = {
      EMPLOYED: 'está trabajando',
      UNEMPLOYED: 'está desemplead' + pronoun,
      STUDENT: 'es estudiante',
      RETIRED: 'está jubilad' + pronoun,
      OTHER: 'trabaja'
  };

  // Relationship status mapping
  const relationshipStatusText = {
      SINGLE: 'Está solter' + pronoun,
      MARRIED: 'Está casad' + pronoun,
      DIVORCED: 'Está divorciad' + pronoun,
      WIDOWED: 'Es viud' + pronoun,
      IN_RELATIONSHIP: 'Está en una relación',
      COMPLICATED: 'Tiene una relación complicada',
      OTHER: 'Está en una relación'
  };

  // Home status mapping
  const homeStatusText = {
      LIVES_ALONE: 'vive sol' + pronoun,
      LIVES_WITH_FAMILY: 'vive con su familia',
      LIVES_WITH_ROOMMATES: 'vive con compañeros de piso',
      HOMELESS: 'no tiene hogar fijo',
      OTHER: 'tiene una situación de vivienda particular'
  };

  // Build the context string with null checks
  let context = '';
  if (name || age) {
    context = `${name} tiene ${age} años`;
    if (workStatus && workStatusText[workStatus]) {
      context += ` y ${workStatusText[workStatus]}`;
    }
    context += '. ';
  }

  if (relationshipStatus && relationshipStatusText[relationshipStatus]) {
    context += `${relationshipStatusText[relationshipStatus]} y `;
  }

  if (homeStatus && homeStatusText[homeStatus]) {
    context += homeStatusText[homeStatus] + '. ';
  } else if (context.endsWith('y ')) {
    context = context.slice(0, -2) + '. ';
  }
  
  if (sobrietyDuration) {
    context += `Lleva ${sobrietyDuration} tratando de mantenerse sobri${pronoun}.`;
  }

  return context.trim();
}

export default {
  generateUserContext,
};