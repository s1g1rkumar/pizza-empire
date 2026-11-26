import { configureStore } from '@reduxjs/toolkit';
import adminReducer from './admin/adminSlice';
import authReducer from './auth/authSlice';
import chainReducer from './chain/chainSlice';
import dashboardReducer from './dashboard/dashboardSlice';
import deliveryReducer from './delivery/deliverySlice';
import employeeReducer from './employees/employeeSlice';
import experienceReducer from './experience/experienceSlice';
import { experienceMiddleware } from './experience/experienceMiddleware';
import factoryReducer from './factories/factorySlice';
import farmReducer from './farm/farmSlice';
import financeReducer from './finance/financeSlice';
import inventoryReducer from './inventory/inventorySlice';
import mallReducer from './malls/mallSlice';
import productionReducer from './production/productionSlice';
import progressionReducer from './progression/progressionSlice';
import restaurantReducer from './restaurants/restaurantSlice';
import supermarketReducer from './supermarkets/supermarketSlice';
import systemReducer from './system/systemSlice';
import upgradeReducer from './upgrades/upgradeSlice';

export const store = configureStore({
  reducer: {
    admin: adminReducer,
    auth: authReducer,
    chain: chainReducer,
    dashboard: dashboardReducer,
    delivery: deliveryReducer,
    employees: employeeReducer,
    experience: experienceReducer,
    factories: factoryReducer,
    farm: farmReducer,
    finance: financeReducer,
    inventory: inventoryReducer,
    malls: mallReducer,
    production: productionReducer,
    progression: progressionReducer,
    restaurants: restaurantReducer,
    supermarkets: supermarketReducer,
    system: systemReducer,
    upgrades: upgradeReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(experienceMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
