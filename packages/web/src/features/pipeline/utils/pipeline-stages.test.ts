import { describe, it, expect } from "vitest";
import {
  PIPELINE_STAGES,
  LOST_STAGE,
  STAGE_DEFAULT_STATUS,
  getStageForStatus,
} from "./pipeline-stages";

describe("pipeline-stages", () => {
  describe("PIPELINE_STAGES", () => {
    it("should have 4 main stages", () => {
      expect(PIPELINE_STAGES).toHaveLength(4);
    });

    it("should have correct stage IDs", () => {
      const ids = PIPELINE_STAGES.map((s) => s.id);
      expect(ids).toEqual(["prospecting", "contacted", "in_progress", "deal_closed"]);
    });

    it("should cover all non-lost statuses", () => {
      const allStatuses = PIPELINE_STAGES.flatMap((s) => s.statuses);
      expect(allStatuses).toContain("not_contacted");
      expect(allStatuses).toContain("contacted");
      expect(allStatuses).toContain("warm");
      expect(allStatuses).toContain("in_progress");
      expect(allStatuses).toContain("mrr");
      expect(allStatuses).toContain("completed");
      expect(allStatuses).not.toContain("lost");
    });
  });

  describe("LOST_STAGE", () => {
    it("should only contain the lost status", () => {
      expect(LOST_STAGE.statuses).toEqual(["lost"]);
    });
  });

  describe("STAGE_DEFAULT_STATUS", () => {
    it("should map each stage to a valid default status", () => {
      expect(STAGE_DEFAULT_STATUS.prospecting).toBe("not_contacted");
      expect(STAGE_DEFAULT_STATUS.contacted).toBe("contacted");
      expect(STAGE_DEFAULT_STATUS.in_progress).toBe("in_progress");
      expect(STAGE_DEFAULT_STATUS.deal_closed).toBe("completed");
      expect(STAGE_DEFAULT_STATUS.lost).toBe("lost");
    });
  });

  describe("getStageForStatus", () => {
    it("should map not_contacted to prospecting", () => {
      expect(getStageForStatus("not_contacted")).toBe("prospecting");
    });

    it("should map contacted to contacted stage", () => {
      expect(getStageForStatus("contacted")).toBe("contacted");
    });

    it("should map warm to contacted stage", () => {
      expect(getStageForStatus("warm")).toBe("contacted");
    });

    it("should map in_progress to in_progress stage", () => {
      expect(getStageForStatus("in_progress")).toBe("in_progress");
    });

    it("should map mrr to deal_closed stage", () => {
      expect(getStageForStatus("mrr")).toBe("deal_closed");
    });

    it("should map completed to deal_closed stage", () => {
      expect(getStageForStatus("completed")).toBe("deal_closed");
    });

    it("should map lost to lost stage", () => {
      expect(getStageForStatus("lost")).toBe("lost");
    });
  });
});
