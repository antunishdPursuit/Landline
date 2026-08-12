import { classifyRequest } from "@/lib/classifier";

describe("classifyRequest", () => {
  // answerable_qa
  describe("answerable_qa", () => {
    it("returns requires_human=false and department=null", () => {
      const result = classifyRequest("answerable_qa", "What is the wifi password?");
      expect(result).toEqual({ requires_human: false, department: null });
    });
  });

  // defer_to_operator
  describe("defer_to_operator", () => {
    it("returns requires_human=true and department=front_desk", () => {
      const result = classifyRequest("defer_to_operator", "I need to speak with someone");
      expect(result).toEqual({ requires_human: true, department: "front_desk" });
    });
  });

  // physical_request — keyword routing
  describe("physical_request — housekeeping keywords", () => {
    it.each([
      "I need more towels",
      "Please change the sheets",
      "Send another pillow and blanket",
      "I need soap, shampoo, and toilet paper",
      "Please bring hair conditioner",
      "Please remove the trash",
      "Can housekeeping clean my room?",
      "Please bring a robe and slippers",
    ])("routes '%s' to housekeeping", (summary) => {
      expect(classifyRequest("physical_request", summary)).toEqual({
        requires_human: false,
        department: "housekeeping",
      });
    });
  });

  describe("physical_request — maintenance keywords", () => {
    it.each([
      "There is a plumbing issue",
      "The AC is not working",
      "The air conditioner is broken",
      "The heater does not turn on",
      "The electrical outlet is broken",
      "The sink is leaking",
      "The toilet is clogged",
      "The shower has no hot water",
      "The television will not turn on",
      "The Wi-Fi is not working",
      "The room safe is broken",
    ])("routes '%s' to maintenance", (summary) => {
      expect(classifyRequest("physical_request", summary)).toEqual({
        requires_human: false,
        department: "maintenance",
      });
    });
  });

  describe("physical_request — room_service keywords", () => {
    it.each([
      "I want room service",
      "I need some food and drinks",
      "Breakfast in bed please",
      "Please send lunch for two",
      "Bring a bucket of ice",
      "Please restock the minibar",
      "Remove the meal tray",
      "Send coffee, tea, and snacks",
    ])("routes '%s' to room_service", (summary) => {
      expect(classifyRequest("physical_request", summary)).toEqual({
        requires_human: false,
        department: "room_service",
      });
    });
  });

  describe("physical_request — concierge fallback", () => {
    it.each(["directions", "recommendation", "booking", "concierge"])(
      "routes '%s' work to front_desk",
      (summary) => {
        const result = classifyRequest("physical_request", summary);
        expect(result).toEqual({ requires_human: false, department: "front_desk" });
      }
    );
  });

  describe("physical_request — fallback to front_desk", () => {
    it.each([
      "I have a general question",
      "My room key does not work",
      "Please hold a package for me",
      "I need help with my luggage",
      "I would like a late checkout",
    ])("routes '%s' to front_desk", (summary) => {
      expect(classifyRequest("physical_request", summary)).toEqual({
        requires_human: false,
        department: "front_desk",
      });
    });

    it("does not match 'ac' inside another word", () => {
      expect(
        classifyRequest("physical_request", "Please hold a package for me")
      ).toEqual({ requires_human: false, department: "front_desk" });
    });
  });

  describe("case insensitivity", () => {
    it("matches uppercase TOWELS to housekeeping", () => {
      const result = classifyRequest("physical_request", "TOWELS please");
      expect(result).toEqual({ requires_human: false, department: "housekeeping" });
    });

    it("matches mixed case Broken to maintenance", () => {
      const result = classifyRequest("physical_request", "Something is Broken in my room");
      expect(result).toEqual({ requires_human: false, department: "maintenance" });
    });
  });

  describe("unknown intent", () => {
    it("throws an error for an unrecognized intent", () => {
      expect(() => classifyRequest("totally_unknown", "some summary")).toThrow(
        "Unknown intent"
      );
    });
  });
});
