import { koreanFoodQuestions } from './korean-food';
import { beautyGeneralQuestions } from './beauty-general';
import { pastryQuestions } from './pastry';

export const questions = [
    ...koreanFoodQuestions,
    ...beautyGeneralQuestions,
    ...pastryQuestions,
];

export const getQuestionsByLicence = (licenceId) =>
    questions.filter(q => q.licenceId === licenceId);

export const getQuestionsBySubject = (licenceId, subject) =>
    questions.filter(q => q.licenceId === licenceId && q.subject === subject);
