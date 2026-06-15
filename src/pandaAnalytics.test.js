import { describe, expect, it } from 'vitest';
import {
  buildAnalyticsComment,
  buildAnalyticsDailyIssue,
  chooseExistingAnalyticsIssue,
  validateAnalyticsPayload
} from '../api/_lib/analytics.js';

describe('Panda Notes analytics collector helpers', () => {
  it('accepts privacy-safe service funnel events and strips noisy fields', () => {
    const validation = validateAnalyticsPayload({
      eventName: 'page_view',
      page: 'services',
      path: '/panda-notes/services.html?utm_source=x',
      title: 'Panda Notes Services',
      referrer: 'https://reddit.com/r/webdev/comments/example',
      sessionId: 'session-1234567890',
      props: {
        offer: 'setup-sprint',
        nested: { ignored: true },
        longText: 'x'.repeat(400)
      }
    });

    expect(validation.ok).toBe(true);
    expect(validation.data.referrerHost).toBe('reddit.com');
    expect(validation.data.path).toBe('/panda-notes/services.html');
    expect(validation.data.props.offer).toBe('setup-sprint');
    expect(validation.data.props.longText).toHaveLength(160);
    expect(validation.data.props.nested).toBeUndefined();
  });

  it('accepts launch promotion events for measuring distribution work', () => {
    const validation = validateAnalyticsPayload({
      eventName: 'launch_copy_post',
      page: 'launch',
      path: '/panda-notes/launch.html',
      title: 'Panda Notes Launch Kit',
      sessionId: 'launch-session-123',
      props: {
        post: 'show-hn'
      }
    });

    expect(validation.ok).toBe(true);
    expect(validation.data.page).toBe('launch');
    expect(validation.data.props.post).toBe('show-hn');
  });

  it('accepts install promotion events for measuring widget adoption', () => {
    const validation = validateAnalyticsPayload({
      eventName: 'install_snippet_copy',
      page: 'install',
      path: '/panda-notes/install.html?ref=reddit',
      title: 'Panda Notes Install',
      sessionId: 'install-session-123',
      props: {
        ref: 'reddit',
        role: 'beta',
        hotkeyConfigured: true
      }
    });

    expect(validation.ok).toBe(true);
    expect(validation.data.page).toBe('install');
    expect(validation.data.path).toBe('/panda-notes/install.html');
    expect(validation.data.props.ref).toBe('reddit');
    expect(validation.data.props.role).toBe('beta');
    expect(validation.data.props.hotkeyConfigured).toBe(true);
  });

  it('rejects unknown analytics events and invalid pages', () => {
    const validation = validateAnalyticsPayload({
      eventName: 'steal_everything',
      page: 'admin',
      sessionId: 'short'
    });

    expect(validation.ok).toBe(false);
    expect(validation.errors).toEqual(expect.arrayContaining([
      'known analytics event is required',
      'known analytics page is required',
      'valid anonymous session id is required'
    ]));
  });

  it('builds daily private analytics issue content and append-only event comments', () => {
    const validation = validateAnalyticsPayload({
      eventName: 'deposit_click',
      page: 'services',
      path: '/panda-notes/services.html',
      sessionId: 'session-1234567890',
      props: {
        offer: 'setup-sprint',
        checkoutState: 'stripe_live',
        destination: 'buy.stripe.com'
      }
    });

    const issue = buildAnalyticsDailyIssue(validation.data, new Date('2026-05-31T12:00:00Z'));
    const comment = buildAnalyticsComment(validation.data, new Date('2026-05-31T12:01:00Z'));

    expect(issue.marker).toBe('panda-analytics-2026-05-31');
    expect(issue.title).toBe('[Analytics] Panda Notes funnel 2026-05-31');
    expect(issue.labels).toEqual(expect.arrayContaining(['analytics', 'service-funnel']));
    expect(issue.body).toContain('panda-analytics-2026-05-31');
    expect(comment).toContain('panda-analytics-event');
    expect(comment).toContain('"eventName": "deposit_click"');
    expect(comment).toContain('"destination": "buy.stripe.com"');
  });

  it('chooses an existing daily analytics issue from listed GitHub issues before creating another one', () => {
    const dailyIssue = {
      marker: 'panda-analytics-2026-06-04',
      title: '[Analytics] Panda Notes funnel 2026-06-04'
    };

    const existing = chooseExistingAnalyticsIssue(dailyIssue, [
      {
        number: 5,
        title: '[Analytics] Panda Notes funnel 2026-06-04',
        body: '<!-- panda-analytics-2026-06-04 -->'
      }
    ]);

    expect(existing.number).toBe(5);
  });
});
