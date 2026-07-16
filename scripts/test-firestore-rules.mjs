// Verifica firestore.rules contra el emulador local: un 'mesero' debe poder abrir/cerrar
// mesa y comanda pero no editar el catalogo, y un 'owner' debe poder todo. Pendiente desde
// Fase 1b (nunca se habia corrido `firebase emulators:start --only firestore` para probar
// esto explicitamente). No toca ningun proyecto Firebase real - todo corre contra el
// emulador en localhost:8080.
//
// Uso: 1) firebase emulators:start --only firestore   (en otra terminal)
//      2) node scripts/test-firestore-rules.mjs

import { readFileSync } from 'fs';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

const PROJECT_ID = 'demo-logic-pos-restaurantes';
const COMPANY_ID = 'comp_test001';
const OWNER_UID = 'owner-uid';
const MESERO_UID = 'mesero-uid';
const ADMIN_UID = 'admin-uid';
const EMPLOYEE_UID = 'employee-uid';
const PLAIN_EMPLOYEE_UID = 'plain-employee-uid'; // kept untouched by the role/branch tests above

let passed = 0;
let failed = 0;

async function check(label, fn) {
  try {
    await fn();
    console.log(`  OK   ${label}`);
    passed++;
  } catch (err) {
    console.log(`  FAIL ${label}`);
    console.log(`       ${err.message.split('\n')[0]}`);
    failed++;
  }
}

const testEnv = await initializeTestEnvironment({
  projectId: PROJECT_ID,
  firestore: {
    rules: readFileSync('firestore.rules', 'utf8'),
    host: 'localhost',
    port: 8080,
  },
});

// Seed company + members + a table, bypassing rules (admin context) - mirrors what
// handleCreateCompany / CompanySettingsView would have already written for real.
await testEnv.withSecurityRulesDisabled(async (ctx) => {
  const db = ctx.firestore();
  await setDoc(doc(db, 'companies', COMPANY_ID), {
    id: COMPANY_ID,
    name: 'Empresa de Prueba',
    ownerId: OWNER_UID,
    businessType: 'restaurante',
  });
  await setDoc(doc(db, 'companies', COMPANY_ID, 'members', OWNER_UID), {
    userId: OWNER_UID,
    name: 'Owner Test',
    email: 'owner@logicpos.com',
    role: 'owner',
  });
  await setDoc(doc(db, 'companies', COMPANY_ID, 'members', MESERO_UID), {
    userId: MESERO_UID,
    name: 'Mesero Test',
    email: 'mesero@logicpos.com',
    role: 'mesero',
  });
  await setDoc(doc(db, 'companies', COMPANY_ID, 'members', ADMIN_UID), {
    userId: ADMIN_UID,
    name: 'Admin Test',
    email: 'admin@logicpos.com',
    role: 'admin',
  });
  await setDoc(doc(db, 'companies', COMPANY_ID, 'members', EMPLOYEE_UID), {
    userId: EMPLOYEE_UID,
    name: 'Employee Test',
    email: 'employee@logicpos.com',
    role: 'employee',
  });
  await setDoc(doc(db, 'companies', COMPANY_ID, 'members', PLAIN_EMPLOYEE_UID), {
    userId: PLAIN_EMPLOYEE_UID,
    name: 'Plain Employee Test',
    email: 'plain-employee@logicpos.com',
    role: 'employee',
  });
  await setDoc(doc(db, 'companies', COMPANY_ID, 'suppliers', 'sup1'), {
    id: 'sup1',
    name: 'Proveedor Test',
  });
  await setDoc(doc(db, 'companies', COMPANY_ID, 'tables', 'table1'), {
    id: 'table1',
    name: 'Mesa 1',
    branchId: 'B-0001',
    status: 'libre',
  });
  await setDoc(doc(db, 'companies', COMPANY_ID, 'products', 'prod1'), {
    id: 'prod1',
    name: 'Cerveza',
    category: 'Bebidas',
    costPrice: 10,
    salePrice: 25,
    stock: 50,
    minStock: 5,
  });
});

const meseroCtx = testEnv.authenticatedContext(MESERO_UID, { email: 'mesero@logicpos.com', email_verified: true });
const ownerCtx = testEnv.authenticatedContext(OWNER_UID, { email: 'owner@logicpos.com', email_verified: true });
const adminCtx = testEnv.authenticatedContext(ADMIN_UID, { email: 'admin@logicpos.com', email_verified: true });
const employeeCtx = testEnv.authenticatedContext(EMPLOYEE_UID, { email: 'employee@logicpos.com', email_verified: true });
const plainEmployeeCtx = testEnv.authenticatedContext(PLAIN_EMPLOYEE_UID, { email: 'plain-employee@logicpos.com', email_verified: true });
const meseroDb = meseroCtx.firestore();
const ownerDb = ownerCtx.firestore();
const adminDb = adminCtx.firestore();
const employeeDb = employeeCtx.firestore();
const plainEmployeeDb = plainEmployeeCtx.firestore();

console.log('\n=== MESERO: deberia poder abrir mesa/comanda, no tocar catalogo ===');

await check('mesero: crear una orden (comanda) abierta', () =>
  assertSucceeds(setDoc(doc(meseroDb, 'companies', COMPANY_ID, 'orders', 'order1'), {
    id: 'order1',
    tableId: 'table1',
    branchId: 'B-0001',
    status: 'open',
    waiterId: MESERO_UID,
    waiterName: 'Mesero Test',
    openedAt: new Date().toISOString(),
    items: [],
  }))
);

await check('mesero: marcar la mesa como ocupada (solo status/currentOrderId)', () =>
  assertSucceeds(updateDoc(doc(meseroDb, 'companies', COMPANY_ID, 'tables', 'table1'), {
    status: 'ocupada',
    currentOrderId: 'order1',
  }))
);

await check('mesero: NO puede renombrar la mesa (fuera de status/currentOrderId)', () =>
  assertFails(updateDoc(doc(meseroDb, 'companies', COMPANY_ID, 'tables', 'table1'), {
    name: 'Mesa Renombrada',
  }))
);

await check('mesero: SI puede vender (solo toca stock del producto)', () =>
  assertSucceeds(updateDoc(doc(meseroDb, 'companies', COMPANY_ID, 'products', 'prod1'), {
    stock: 49,
  }))
);

await check('mesero: NO puede editar el catalogo (precio de venta)', () =>
  assertFails(updateDoc(doc(meseroDb, 'companies', COMPANY_ID, 'products', 'prod1'), {
    salePrice: 999,
  }))
);

await check('mesero: NO puede borrar una orden', () =>
  assertFails(deleteDoc(doc(meseroDb, 'companies', COMPANY_ID, 'orders', 'order1')))
);

console.log('\n=== OWNER: deberia poder todo ===');

await check('owner: SI puede renombrar la mesa', () =>
  assertSucceeds(updateDoc(doc(ownerDb, 'companies', COMPANY_ID, 'tables', 'table1'), {
    name: 'Mesa Renombrada por Owner',
  }))
);

await check('owner: SI puede editar el catalogo (precio de venta)', () =>
  assertSucceeds(updateDoc(doc(ownerDb, 'companies', COMPANY_ID, 'products', 'prod1'), {
    salePrice: 30,
  }))
);

await check('owner: SI puede borrar una orden', () =>
  assertSucceeds(deleteDoc(doc(ownerDb, 'companies', COMPANY_ID, 'orders', 'order1')))
);

console.log('\n=== ASIGNACION DE SUCURSAL: solo el owner puede reasignarla ===');

await check('admin: NO puede reasignar la sucursal de un empleado', () =>
  assertFails(updateDoc(doc(adminDb, 'companies', COMPANY_ID, 'members', EMPLOYEE_UID), {
    assignedBranchId: 'B-9999',
  }))
);

await check('admin: SI puede seguir cambiando el rol de un empleado (no regresion)', () =>
  assertSucceeds(updateDoc(doc(adminDb, 'companies', COMPANY_ID, 'members', EMPLOYEE_UID), {
    role: 'admin',
  }))
);

await check('owner: SI puede reasignar la sucursal de un empleado', () =>
  assertSucceeds(updateDoc(doc(ownerDb, 'companies', COMPANY_ID, 'members', EMPLOYEE_UID), {
    assignedBranchId: 'B-9999',
  }))
);

console.log('\n=== PERMISO EXTRA suppliers_restock ===');

await check('empleado SIN permiso: NO puede editar un proveedor', () =>
  assertFails(updateDoc(doc(plainEmployeeDb, 'companies', COMPANY_ID, 'suppliers', 'sup1'), {
    category: 'Bebidas',
  }))
);

await testEnv.withSecurityRulesDisabled(async (ctx) => {
  await updateDoc(doc(ctx.firestore(), 'companies', COMPANY_ID, 'members', PLAIN_EMPLOYEE_UID), {
    permissions: ['suppliers_restock'],
  });
});

await check('empleado CON permiso suppliers_restock: SI puede editar un proveedor', () =>
  assertSucceeds(updateDoc(doc(plainEmployeeDb, 'companies', COMPANY_ID, 'suppliers', 'sup1'), {
    category: 'Bebidas',
  }))
);

await testEnv.cleanup();

console.log(`\n${passed} pasaron, ${failed} fallaron.`);
process.exit(failed > 0 ? 1 : 0);
