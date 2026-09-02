import { expect, test } from "@playwright/test";

/**
 * /customer/tarzzo/mesa — el anteproyecto de la mesa de terrazo.
 *
 * Es la única página del sitio con su propia identidad visual y con una
 * pieza interactiva de verdad (la planta de la lámina L—03), así que
 * tiene su propio archivo: que las 12 láminas rendericen y que poner un
 * vaso encienda cabezales son dos cosas que ningún otro test cubre.
 */

const LECTURA = ".mesa .mando span[aria-live]";

test("renderiza las 12 láminas del documento", async ({ page }) => {
  await page.goto("/customer/tarzzo/mesa");
  await expect(page.locator("h1")).toContainText("mesa de terrazo");
  await expect(page.locator(".mesa .lamina")).toHaveCount(12);
  await expect(page.locator(".mesa .folio").first()).toHaveText("L—00");
  // El documento vive solo en español: ofrecer el toggle llevaría a un 404.
  await expect(page.locator(".locale-switcher")).toHaveCount(0);
});

test("la planta responde: poner un vaso enciende cabezales", async ({ page }) => {
  await page.goto("/customer/tarzzo/mesa");
  const lienzo = page.locator("#lienzoPlanta");
  await lienzo.scrollIntoViewIfNeeded();
  // Arranca con dos objetos puestos para que la mesa nunca se vea apagada.
  await expect(page.locator(LECTURA)).toContainText("2 objetos");

  const caja = await lienzo.boundingBox();
  expect(caja).not.toBeNull();
  // Esquina inferior izquierda del viewBox: lejos de los dos objetos
  // iniciales, así que el clic pone uno nuevo en vez de levantar alguno.
  await lienzo.click({
    position: { x: caja!.width * 0.15, y: caja!.height * 0.75 },
  });
  await expect(page.locator(LECTURA)).toContainText("3 objetos");

  await page.locator(".mesa .boton").click();
  await expect(page.locator(LECTURA)).toContainText("0 objetos");
  await expect(page.locator(LECTURA)).toContainText("modo de reposo");
});

test("no hay desbordamiento horizontal", async ({ page }) => {
  await page.goto("/customer/tarzzo/mesa");
  await page.waitForFunction(
    () => {
      const el = document.scrollingElement;
      return !!el && el.scrollWidth <= window.innerWidth;
    },
    undefined,
    { timeout: 10_000 }
  );
});

test("la ruta vieja /mesa-tarzzo redirige a la buena", async ({ page }) => {
  await page.goto("/mesa-tarzzo");
  await expect(page).toHaveURL(/\/customer\/tarzzo\/mesa$/);
});
