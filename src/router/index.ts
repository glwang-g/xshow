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
      redirect: "/workbench/free",
    },
    {
      path: "/workbench/free",
      name: "workbench-free",
      component: () => import("@/views/Home.vue"),
    },
    {
      path: "/workbench/workshop",
      name: "workbench-workshop",
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
    {
      path: "/logic-lab",
      name: "logic-lab",
      component: () => import("@/views/LogicLab.vue"),
    },
    {
      path: "/computer-lab",
      name: "computer-lab",
      component: () => import("@/views/ComputerLab.vue"),
    },
    {
      path: "/rubiks-cube",
      name: "rubiks-cube",
      component: () => import("@/views/RubiksCube.vue"),
    },
  ],
});

export default router;
