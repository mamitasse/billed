/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { bills } from "../fixtures/bills";
import router from "../app/Router.js";

// Mock de la méthode bills du store
jest.mock("../app/store", () => mockStore);

describe("Given I am connected as an Employee", () => {
  // Test pour BillsUI.js
  describe("When I am on Bills page, there is a bill icon in vertical layout", () => {
    test("Then, the icon should be highlighted", async () => {
      // Définition de localStorageMock
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      // Attente du rendu de l'icône avant de vérifier
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      const isIconActivated = windowIcon.classList.contains("active-icon");
      expect(isIconActivated).toBeTruthy();
    });


    describe("When I am on Bills page, there are a title and a newBill button", () => {
      // Test pour le bouton "Nouvelle note de frais"
      test("Then, the title and the button should be render correctly", () => {
        // Mise en place du contexte : on définit le contenu du corps du document à partir du composant BillsUI avec une liste de données vide.
        document.body.innerHTML = BillsUI({ data: [] });
        // Assertion : Vérification que le texte "Mes notes de frais" est présent dans le document.
        expect(screen.getAllByText("Mes notes de frais")).toBeTruthy();
         // Assertion : Vérification que l'élément avec l'attribut data-testid égal à "btn-new-bill" est présent dans le document.
        expect(screen.getByTestId("btn-new-bill")).toBeTruthy();
      });
    });

  });

  describe("When I am on Bills page as an Employee", () => {
    test("Then, 'Mes notes de frais' page should be rendered", async () => {
      // Définir localStorageMock
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);

      // Attendre le rendu de l'icône avant de vérifier
      await waitFor(() => screen.getAllByTestId("icon-window")[0]);

      // Vérifier que la page "Mes notes de frais" est rendue
      expect(screen.getByText("Mes notes de frais")).toBeTruthy();
    });
  });

  describe("When I am on Bills page, there are 4 bills", () => {
    test("Then, bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);

      expect(dates).toEqual(datesSorted);
    });
  });

  describe("When I am on Bills page, and there are no bills", () => {
    test("Then, no bills should be shown", () => {
      document.body.innerHTML = BillsUI({ data: [] });
      const bill = screen.queryByTestId("bill");
      expect(bill).toBeNull();
    });
  });

  describe("When I am on Bills page, but it is loading", () => {
    test("Then, Loading page should be rendered", () => {
      document.body.innerHTML = BillsUI({ loading: true });
      expect(screen.getAllByText("Loading...")).toBeTruthy();
    });
  });

  describe("When I am on Dashboard page but back-end send an error message", () => {
    test("Then, Error page should be rendered", () => {
      document.body.innerHTML = BillsUI({ error: "some error message" });
      expect(screen.getAllByText("Erreur")).toBeTruthy();
    });
  });
});

// Test for Bills.js
describe("Given I am connected as Employee and I am on Bill page, there is a newBill button", () => {
  describe("When clicking on newBill button", () => {
    test("Then, bill form should open", () => {
      // Définition de localStorageMock
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      document.body.innerHTML = BillsUI({ data: [] });
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = null;
      const bill = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      // Utilisation de userEvent.click pour déclencher l'événement de clic
      userEvent.click(screen.getByTestId("btn-new-bill"));

      // Vérification de l'ouverture du formulaire de note de frais
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
    });
  });
});

describe("Given I am connected as Employee and I am on Bill page, there are a newBill button", () => {
  describe("When clicking on newBill button", () => {
    test("Then, bill form should open", () => {
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      document.body.innerHTML = BillsUI({ data: [] });
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = null;
      const bill = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage,
      });

      const handleClickNewBill = jest.fn(() => bill.handleClickNewBill());
      screen.getByTestId("btn-new-bill").addEventListener("click", handleClickNewBill);
      userEvent.click(screen.getByTestId("btn-new-bill"));
      expect(handleClickNewBill).toHaveBeenCalled();
      expect(screen.getByText("Envoyer une note de frais")).toBeTruthy();
    });
  });
});

// Test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bill", () => {
    beforeEach(() => {
      // Utilisation de jest.spyOn pour espionner la méthode bills du store
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", { value: localStorageMock });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@au.fr",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });

    test("Then, fetches bills from mock API GET", async () => {
      window.onNavigate(ROUTES_PATH.Bills);
      expect(screen.getAllByText("Billed")).toBeTruthy();
      // Utilisation de await pour attendre la résolution de la promesse
      await waitFor(() => screen.getByText("Mes notes de frais"));
      expect(screen.getByTestId("tbody")).toBeTruthy();
      expect(screen.getAllByText("test1")).toBeTruthy();
    });

    test("Then, fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    });

    test("Then, fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"));
          },
        };
      });
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    });
  });
});


describe("Bills container", () => {
  describe("handleClickIconEye", () => {
    test("should open modal with correct bill URL", () => {
      // Mocking necessary elements
      const iconEye = document.createElement("div");
      iconEye.setAttribute("data-testid", "icon-eye");
      iconEye.setAttribute("data-bill-url", "https://example.com/bill.jpg");
      document.body.appendChild(iconEye);

      // Mocking modal elements
      const modalFile = document.createElement("div");
      modalFile.setAttribute("id", "modaleFile");
      document.body.appendChild(modalFile);

      const modalBody = document.createElement("div");
      modalBody.setAttribute("class", "modal-body");
      modalFile.appendChild(modalBody);

      // Creating instance of Bills container
      const billsContainer = new Bills({
        document,
        onNavigate: jest.fn(),
        store: null,
        localStorage: localStorageMock,
      });
$.fn.modal=jest.fn()
      // Triggering click event
      billsContainer.handleClickIconEye(iconEye);

      // Verifying modal content and open modal
      expect(modalBody.innerHTML).toContain( "<div style=\"text-align: center;\" class=\"bill-proof-container\"><img width=\"0\" src=\"https://example.com/bill.jpg\" alt=\"Bill\"></div>");
     
    });
  });
}); 
