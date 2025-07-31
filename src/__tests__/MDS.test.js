//
//  MDS.test.js
//  doubleact
//
//  Copyright © 2025 Chorale LLC
//

import {Scanning} from '@/MDS';
import {Operations} from "@/SCD";

// Mock the Operations class so we can spy on its methods
jest.mock('../SCD', () => ({
    // We need to keep the original implementation of Scanning
    ...jest.requireActual('../SCD'),
    // But we want to mock Operations
    Operations: {
        sendSystemMessage: jest.fn(), // This creates a mock function
    },
}));

// A "describe" block groups related tests together
describe('Scanning.scanAgentResponse', () => {

    // Clear mock history before each test to ensure tests are isolated
    beforeEach(() => {
        Operations.sendSystemMessage.mockClear();
    });

    // Test Case 1: A successful scan with multiple valid calls
    it('should correctly parse all valid system calls and not notify the agent', () => {
        const agentResponse = `
            ###order-123###
            SYSTEM CALL
            Type: Order
            {"item": "Nano-spool"}
            ###order-123###

            ###report-456###
            SYSTEM CALL
            Type: Report
            {"status": "Nominal"}
            ###report-456###
        `;

        const result = Scanning.scanAgentResponse(agentResponse, 'Agent-01');

        // Assertions:
        expect(result).toHaveLength(2); // We expect to find 2 valid calls
        expect(result[0].id).toBe('order-123');
        expect(result[1].payload.status).toBe('Nominal');
        expect(Operations.sendSystemMessage).not.toHaveBeenCalled(); // The agent should NOT be notified
    });

    // Test Case 2: A submission with a malformed call (invalid JSON)
    it('should reject the entire batch and notify agent if one call has invalid JSON', () => {
        const agentResponseWithBadJson = `
            ###order-789###
            SYSTEM CALL
            Type: Order
            {"item": "Valid Item"}
            ###order-789###

            ###report-abc###
            SYSTEM CALL
            Type: Report
            {"status": "ERROR",} // Invalid JSON: trailing comma
            ###report-abc###
        `;

        const result = Scanning.scanAgentResponse(agentResponseWithBadJson, 'Agent-02');

        // Assertions:
        expect(result).toEqual([]); // The result should be an empty array
        expect(Operations.sendSystemMessage).toHaveBeenCalledTimes(1); // The agent SHOULD be notified once
        // You can even check what it was called with:
        expect(Operations.sendSystemMessage).toHaveBeenCalledWith(
            'Agent-02',
            "Your last submission failed. Please check your system calls for formatting errors and resubmit."
        );
    });

    // Test Case 3: Submission with a missing "Type" field
    it('should reject the batch and notify agent if a call is missing the Type field', () => {
        const agentResponseMissingType = `
            ###refuse-101###
            SYSTEM CALL
            // No Type field here
            {"reason": "Access Denied"}
            ###refuse-101###
        `;

        const result = Scanning.scanAgentResponse(agentResponseMissingType, 'Agent-03');

        expect(result).toEqual([]);
        expect(Operations.sendSystemMessage).toHaveBeenCalledTimes(1);
    });

    // Test Case 4: A response with no system calls at all
    it('should return an empty array for text with no system calls', () => {
        const agentResponse = "Just a regular status update, no system calls to report.";

        const result = Scanning.scanAgentResponse(agentResponse, 'Agent-04');

        expect(result).toEqual([]);
        expect(Operations.sendSystemMessage).not.toHaveBeenCalled();
    });
});
