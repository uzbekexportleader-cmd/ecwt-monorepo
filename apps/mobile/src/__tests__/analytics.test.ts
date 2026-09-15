import { flush, track } from '../services/analytics';
import { api } from '../api/client';

jest.mock('../api/client', () => ({
  api: { analytics: { send: jest.fn() } },
}));

const send = api.analytics.send as jest.Mock;

describe('analitika navbati', () => {
  beforeEach(() => {
    send.mockReset();
    send.mockResolvedValue(undefined);
  });

  it('hodisa navbatga tushadi va yuboriladi', async () => {
    track('app.opened');
    await flush();

    expect(send).toHaveBeenCalledTimes(1);
    const batch = send.mock.calls[0][0];
    expect(batch.events).toHaveLength(1);
    expect(batch.events[0].name).toBe('app.opened');
    // Offline navbat uchun vaqt mijozda qayd etiladi
    expect(batch.events[0].occurredAt).toEqual(expect.any(String));
  });

  it('qadam nomi props orqali uzatiladi', async () => {
    track('onboarding.step.viewed', { step: 'bank', index: 6 });
    await flush();

    expect(send.mock.calls[0][0].events[0].props).toEqual({ step: 'bank', index: 6 });
  });

  /**
   * Eng muhim xatti-harakat: internet yo'q bo'lsa hodisa YO'QOLMASLIGI
   * kerak — aks holda aynan aloqa yomon hududlardagi voronka ko'rinmay
   * qoladi, ya'ni eng kerakli ma'lumot yo'qoladi.
   */
  it('yuborish muvaffaqiyatsiz bo‘lsa hodisa navbatda qoladi', async () => {
    send.mockRejectedValueOnce(new Error('tarmoq yo‘q'));

    track('auth.otp.requested');
    await flush();
    expect(send).toHaveBeenCalledTimes(1);

    // Ikkinchi urinishda o'sha hodisa qaytadan yuboriladi
    send.mockResolvedValue(undefined);
    await flush();

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0].events[0].name).toBe('auth.otp.requested');
  });

  it('navbat bo‘sh bo‘lsa so‘rov yuborilmaydi', async () => {
    await flush();
    expect(send).not.toHaveBeenCalled();
  });
});
