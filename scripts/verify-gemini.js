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
  let detail = error.message;
  if (detail.includes('HTTP 404') && process.env.GEMINI_API_KEY) {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', {
        headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY },
      });
      const data = await response.json();
      const models = (data.models || [])
        .filter(model => model.supportedGenerationMethods?.includes('generateContent'))
        .map(model => model.name?.replace(/^models\//, ''))
        .filter(name => name?.includes('flash'))
        .slice(0, 20);
      if (models.length) detail += ` 사용 가능 Flash 모델: ${models.join(', ')}`;
    } catch { /* 진단 목록을 못 읽어도 원래 오류를 유지한다. */ }
  }
  console.error(`::error title=Gemini 연결 실패::${detail}`);
  process.exitCode = 1;
}
