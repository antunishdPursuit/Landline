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
    it("routes 'towels' to housekeeping", () => {
      const result = classifyRequest("physical_request", "I need more towels");
      expect(result).toEqual({ requires_human: false, department: "housekeeping" });
    });

    it("routes 'sheets' to housekeeping", () => {
      const result = classifyRequest("physical_request", "Please change the sheets");
      expect(result).toEqual({ requires_human: false, department: "housekeeping" });
    });

    it("routes 'cleaning' to housekeeping", () => {
      const result = classifyRequest("physical_request", "I need room cleaning");
      expect(result).toEqual({ requires_human: false, department: "housekeeping" });
    });

    it("routes 'linen' to housekeeping", () => {
      const result = classifyRequest("physical_request", "Fresh linen please");
      expect(result).toEqual({ requires_human: false, department: "housekeeping" });
    });
  });

  describe("physical_request — maintenance keywords", () => {
    it("routes 'plumbing' to maintenance", () => {
      const result = classifyRequest("physical_request", "There is a plumbing issue");
      expect(result).toEqual({ requires_human: false, department: "maintenance" });
    });

    it("routes 'ac' to maintenance", () => {
      const result = classifyRequest("physical_request", "The AC is not working");
      expect(result).toEqual({ requires_human: false, department: "maintenance" });
    });

    it("routes 'electrical' to maintenance", () => {
      const result = classifyRequest("physical_request", "Electrical outlet not working");
      expect(result).toEqual({ requires_human: false, department: "maintenance" });
    });

    it("routes 'broken' to maintenance", () => {
      const result = classifyRequest("physical_request", "Something is broken");
      expect(result).toEqual({ requires_human: false, department: "maintenance" });
    });

    it("routes 'leak' to maintenance", () => {
      const result = classifyRequest("physical_request", "There is a water leak");
      expect(result).toEqual({ requires_human: false, department: "maintenance" });
    });
  });

  describe("physical_request — room_service keywords", () => {
    it("routes 'room service' to room_service", () => {
      const result = classifyRequest("physical_request", "I want room service");
      expect(result).toEqual({ requires_human: false, department: "room_service" });
    });

    it("routes 'food' to room_service", () => {
      const result = classifyRequest("physical_request", "I need some food");
      expect(result).toEqual({ requires_human: false, department: "room_service" });
    });

    it("routes 'drink' to room_service", () => {
      const result = classifyRequest("physical_request", "Bring me a drink");
      expect(result).toEqual({ requires_human: false, department: "room_service" });
    });

    it("routes 'meal' to room_service", () => {
      const result = classifyRequest("physical_request", "I would like a meal delivered");
      expect(result).toEqual({ requires_human: false, department: "room_service" });
    });

    it("routes 'breakfast' to room_service", () => {
      const result = classifyRequest("physical_request", "Breakfast in bed please");
      expect(result).toEqual({ requires_human: false, department: "room_service" });
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
    it("falls back to front_desk when no keyword matches", () => {
      const result = classifyRequest("physical_request", "I have a general question");
      expect(result).toEqual({ requires_human: false, department: "front_desk" });
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
