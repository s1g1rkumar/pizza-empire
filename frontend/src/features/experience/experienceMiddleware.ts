import { isFulfilled, Middleware } from '@reduxjs/toolkit';
import { soundEngine } from '@/utils/soundEngine';
import {
  pushToast,
  showAchievementPopup,
  showLevelUpBanner,
  triggerCurrencyDelta,
} from './experienceSlice';

function extractCash(state: Record<string, unknown>): number | null {
  const dash = state.dashboard as { data?: { profile?: { cashBalance?: number } } } | undefined;
  const farm = state.farm as { data?: { player?: { cashBalance?: number } } } | undefined;
  const rest = state.restaurants as { data?: { cashBalance?: number } } | undefined;
  const fac = state.factories as { data?: { cashBalance?: number } } | undefined;
  const sup = state.supermarkets as { data?: { cashBalance?: number } } | undefined;
  const mall = state.malls as { data?: { cashBalance?: number } } | undefined;
  const del = state.delivery as { data?: { cashBalance?: number } } | undefined;

  return (
    farm?.data?.player?.cashBalance ??
    rest?.data?.cashBalance ??
    fac?.data?.cashBalance ??
    sup?.data?.cashBalance ??
    mall?.data?.cashBalance ??
    del?.data?.cashBalance ??
    dash?.data?.profile?.cashBalance ??
    null
  );
}

export const experienceMiddleware: Middleware = (storeApi) => (next) => (action) => {
  const prevState = storeApi.getState() as Record<string, unknown>;
  const prevCash = extractCash(prevState);

  const result = next(action);

  if (!isFulfilled(action)) {
    return result;
  }

  const nextState = storeApi.getState() as Record<string, unknown>;
  const nextCash = extractCash(nextState);

  const actionType = action.type;

  // Detect currency changes on interactive actions (skip initial fetches)
  if (
    !actionType.endsWith('/fetch/fulfilled') &&
    !actionType.includes('fetchDashboard') &&
    !actionType.includes('restoreSession') &&
    prevCash !== null &&
    nextCash !== null &&
    Math.abs(nextCash - prevCash) >= 0.01
  ) {
    const delta = nextCash - prevCash;
    storeApi.dispatch(triggerCurrencyDelta(delta));
    if (delta > 0) {
      soundEngine.play('coin');
    }
  }

  if (actionType.includes('farm/harvest') || actionType.includes('harvestPlot')) {
    soundEngine.play('harvest');
    storeApi.dispatch(
      pushToast({
        kind: 'HARVEST',
        title: 'Crop Harvested!',
        message: 'Fresh produce added to your barn inventory.',
      })
    );
  } else if (
    actionType.includes('production/collect') ||
    actionType.includes('factories/startOrder') ||
    actionType.includes('production/startOrder')
  ) {
    soundEngine.play('production');
    storeApi.dispatch(
      pushToast({
        kind: 'PRODUCTION',
        title: 'Production Update',
        message: 'Batch processing updated and inventory synchronized.',
      })
    );
  } else if (actionType.includes('claimMission')) {
    soundEngine.play('coin');
    storeApi.dispatch(
      pushToast({
        kind: 'MISSION',
        title: 'Mission Completed!',
        message: 'Mission reward claimed and credited to your empire.',
      })
    );
  } else if (actionType.includes('claimAchievement')) {
    soundEngine.play('achievement');
    storeApi.dispatch(
      showAchievementPopup({
        title: 'Achievement Unlocked!',
        message: 'Milestone reward added to your Pizza Empire profile.',
      })
    );
  } else if (actionType.includes('unlockLevel') || actionType.includes('progression/unlock')) {
    soundEngine.play('levelup');
    storeApi.dispatch(
      showLevelUpBanner({
        title: 'Business Stage Unlocked!',
        subtitle: 'Your Pizza Empire has expanded to the next tier.',
      })
    );
  } else if (
    actionType.includes('upgrades/purchase') ||
    actionType.includes('upgrade') ||
    actionType.includes('purchaseMachine') ||
    actionType.includes('addFloor')
  ) {
    soundEngine.play('upgrade');
    storeApi.dispatch(
      pushToast({
        kind: 'UPGRADE',
        title: 'Upgrade Confirmed',
        message: 'Facility upgrade installed and active in the game engine.',
      })
    );
  } else if (
    actionType.includes('supermarkets/runSales') ||
    actionType.includes('malls/collectRent') ||
    actionType.includes('delivery/complete')
  ) {
    soundEngine.play('coin');
    storeApi.dispatch(
      pushToast({
        kind: 'NOTIFICATION',
        title: 'Revenue Collected',
        message: 'Earnings deposited into your empire treasury.',
      })
    );
  }

  return result;
};
