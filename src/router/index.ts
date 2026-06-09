import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/views/Hub.vue"),
    },
    {
      path: "/workbench",
      name: "workbench",
      component: () => import("@/views/Home.vue"),
    },
    {
      path: "/tank-lab",
      name: "tank-lab",
      component: () => import("@/views/TankLab.vue"),
    },
    {
      path: "/repair-lab",
      name: "repair-lab",
      component: () => import("@/views/RepairLab.vue"),
    },
  ],
});

export default router;
