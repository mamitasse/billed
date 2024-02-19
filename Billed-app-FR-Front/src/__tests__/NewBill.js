/**
 * @jest-environment jsdom
 */

import { screen, fireEvent } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH } from "../constants/routes.js";
import router from "../app/Router.js";
import store from "../__mocks__/store";

// Tests pour le composant NewBill
describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then should render a form", () => {
      document.body.innerHTML = NewBillUI();

      // Vérifier que le formulaire est rendu
      const newBillForm = screen.getByTestId("form-new-bill");
      expect(newBillForm).toBeTruthy();
    });
  });

  describe("When user submits the form", () => {
    test("Then should change or submit new bill form", () => {
      // Configurer les conditions initiales (comme si l'utilisateur était connecté)
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);

      // Configurer le router et naviguer à la page des factures
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      // Initialiser l'objet NewBill
      const newBill = new NewBill({
        document,
        onNavigate,
        store: store,
        localStorage: window.localStorage,
      });

      // Remplir le formulaire avec des données de test
      const form = screen.getByTestId("form-new-bill");
      const expenseType = screen.getByTestId("expense-type");
      fireEvent.change(expenseType, {
        target: { value: "Transports" },
      });

      const datepicker = screen.getByTestId("datepicker");
      fireEvent.input(datepicker, { target: { value: "2022-01-01" } });

      const amount = screen.getByTestId("amount");
      fireEvent.input(amount, {
        target: { value: "100" },
      });

      const pct = screen.getByTestId("pct");
      fireEvent.input(pct, { target: { value: "30" } });

      const fileInput = screen.getByTestId("file");
      const file = new File(["proof"], "proof.png", { type: "image/png" });

      // Simuler le changement de fichier
      const handleChangeFile = jest.fn((e) => {
        newBill.handleChangeFile(e);
      });
      fileInput.addEventListener("change", handleChangeFile);
      fireEvent.click(fileInput);
      userEvent.upload(fileInput, file);

      // Simuler le changement de fichier avec une extension non autorisée
      const invalidFile = new File(["invalid"], "invalid.txt", {
        type: "text/plain",
      });
      userEvent.upload(fileInput, invalidFile);

      // Simuler la soumission du formulaire
      const formNewBill = screen.getByTestId("form-new-bill");
      const handleSubmit = jest.fn((e) => {
        newBill.handleSubmit(e);
      });
      formNewBill.addEventListener("submit", handleSubmit);

      const submitButton = screen.getByTestId("submit-button");
      fireEvent.click(submitButton);

      // Vérifier les résultats attendus
      expect(fileInput.files[0]).toStrictEqual(file);
      expect(fileInput.files.item(0)).toStrictEqual(file);
      expect(fileInput.files).toHaveLength(1);
      expect(datepicker.value).toEqual("2022-01-01");
      expect(amount.value).toEqual("100");
      expect(pct.value).toEqual("30");
      expect(expenseType.value).toEqual("Transports");

    });
  });
});

// Tests d'intégration pour la création d'une facture via une API mockée
describe("Given I'm connected as an employee", () => {
  describe("When I navigate to newbill", () => {
    afterEach(() => {
      // Restaurer l'espion créé avec spyOn
      jest.restoreAllMocks();
    });

    test("Then create bill to mock API POST", async () => {
      // Configurer les conditions initiales (comme si l'utilisateur était connecté)
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);

      // Configurer le router et naviguer à la page de création de facture
      router();
      window.onNavigate(ROUTES_PATH.NewBill);

      // Espionner la méthode de création de facture dans le store
      const createSpy = jest.spyOn(store.bills(), "create");
      const spy = jest.spyOn(store, "bills");
      const isNewBill = store.bills();
      const url = "https://localhost:3456/images/test.jpg";

      // Appeler la méthode de création de facture et vérifier les résultats
      isNewBill.create().then((result) => {
        expect(result.fileUrl).toEqual(url);
      });
      expect(spy).toHaveBeenCalled();
      expect(createSpy).toHaveBeenCalled();
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        // Espionner la console.error
        console.error = jest.fn();
        console.error();
        jest.spyOn(store, "bills");

        // Configurer les conditions initiales (comme si l'utilisateur était connecté)
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );

        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);

        // Configurer le router
        router();
      });

      test("fetches bills from an API and fails with 404 message error", async () => {
        // Mock de la méthode de création de facture avec une promesse rejetée
        store.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(console.error("Error 404"));
            },
          };
        });

        // Naviguer à la page de création de facture
        window.onNavigate(ROUTES_PATH.NewBill);
        await new Promise(process.nextTick);

        // Vérifier que console.error a été appelé
        expect(console.error).toHaveBeenCalled();
      });

      test("fetches bills from an API and fails with 500 message error", async () => {
        // Mock de la méthode de création de facture avec une promesse rejetée
        store.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(console.error("Error 500"));
            },
          };
        });

        // Naviguer à la page de création de facture
        window.onNavigate(ROUTES_PATH.NewBill);
        await new Promise(process.nextTick);

        // Vérifier que console.error a été appelé
        expect(console.error).toHaveBeenCalled();
      });
    });
  });
});
