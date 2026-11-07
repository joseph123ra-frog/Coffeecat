import { generate, responseText } from '../src/gemini.js';

const result = await generate({
  contents: [{ role: 'user', parts: [{ text: '다음 글자 하나만 답하세요: 확인' }] }],
  generationConfig: { maxOutputTokens: 128, temperature: 0 },
});

if (!responseText(result).includes('확인')) throw new Error('Gemini 응답 확인 실패');
console.log('Gemini 무료 프로젝트 키 연결 확인 완료');
