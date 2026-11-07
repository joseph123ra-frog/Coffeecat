import { generate, responseText } from '../src/gemini.js';

try {
  const result = await generate({
    contents: [{ role: 'user', parts: [{ text: '다음 글자 하나만 답하세요: 확인' }] }],
    generationConfig: {
      maxOutputTokens: 512,
      temperature: 0,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  if (!responseText(result).includes('확인')) throw new Error('Gemini 응답 확인 실패');
  console.log('Gemini 무료 프로젝트 키 연결 확인 완료');
} catch (error) {
  console.error(`::error title=Gemini 연결 실패::${error.message}`);
  process.exitCode = 1;
}
