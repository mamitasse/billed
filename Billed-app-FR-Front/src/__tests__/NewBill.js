// Teste le comportement de la page NewBill lorsque l'utilisateur est connecté en tant qu'employé.
import { fireEvent, screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import userEvent from "@testing-library/user-event";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES } from "../constants/routes.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then, it should them in the page", () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // Mock de localStorage avec un utilisateur de type 'Admin'
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Admin",
        })
      );

      // Initialisation de la page NewBill et du formulaire
      const html = NewBillUI();
      document.body.innerHTML = html;
      const firestore = null;
      const newBill = new NewBill({
        document,
        onNavigate,
        firestore,
        localStorage,
      });

      // Simule la saisie d'informations dans le formulaire
      const expenseType = screen.getByTestId("expense-type");
      fireEvent.change(expenseType, { target: { value: "Transport" } });

      const expenseName = screen.getByTestId("expense-name");
      fireEvent.change(expenseName, { target: { value: "Essence" } });

      const expenseAmount = screen.getByTestId("amount");
      fireEvent.change(expenseAmount, { target: { value: 50 } });

      const expenseCommentary = screen.getByTestId("commentary");
      fireEvent.change(expenseCommentary, {
        target: { value: "Pour le trajet à mon travail" },
      });

      const expensePct = screen.getByTestId("pct");
      fireEvent.change(expensePct, { target: { value: 20 } });

      // Simule la soumission du formulaire
      const form = screen.getByTestId("form-new-bill");
      const handleClick = jest.fn(newBill.handleSubmit);
      form.addEventListener("click", handleClick);
      userEvent.click(form);

      // Vérifie que les champs du formulaire ont des valeurs non vides
      expect(expenseName.value).toBeTruthy();
      expect(expenseAmount.value).toBeTruthy();
      expect(expenseCommentary.value).toBeTruthy();
      expect(expensePct.value).toBeTruthy();

      // Vérifie que la fonction handleSubmit a été appelée
      expect(handleClick).toHaveBeenCalled();
    });
  });
});

