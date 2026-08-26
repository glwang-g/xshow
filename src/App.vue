<template>
  <RouterView v-slot="{ Component, route }">
    <Transition mode="out-in" name="route-fade">
      <component :is="Component" :key="route.fullPath" />
    </Transition>
  </RouterView>
</template>

<style>
.route-fade-enter-active,
.route-fade-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.route-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.route-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
