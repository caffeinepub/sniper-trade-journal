import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
    public type UserRole = {
        #admin;
        #user;
        #guest;
    };

    public type AccessControlState = {
        var adminAssigned : Bool;
        userRoles : Map.Map<Principal, UserRole>;
    };

    public func initState() : AccessControlState {
        {
            var adminAssigned = false;
            userRoles = Map.empty<Principal, UserRole>();
        }
    };

    public func initialize(state : AccessControlState, caller : Principal, adminToken : Text, userProvidedToken : Text) {
        // If caller is anonymous: return immediately (no-op)
        if (caller.isAnonymous()) {
            return;
        };

        // If caller already has a role: return immediately (no-op)
        switch (state.userRoles.get(caller)) {
            case (?_role) { return };
            case (null) {};
        };

        // If adminAssigned is false: assign #admin role to caller, set adminAssigned = true
        if (not state.adminAssigned) {
            state.userRoles.add(caller, #admin);
            state.adminAssigned := true;
        } else {
            // Otherwise: assign #user role to caller
            state.userRoles.add(caller, #user);
        };
    };

    public func getUserRole(state : AccessControlState, caller : Principal) : UserRole {
        if (caller.isAnonymous()) {
            return #guest;
        };

        switch (state.userRoles.get(caller)) {
            case (?role) { role };
            case (null) { #guest };
        };
    };

    public func assignRole(state : AccessControlState, caller : Principal, user : Principal, role : UserRole) {
        // Admin-only guard
        if (not isAdmin(state, caller)) {
            return;
        };

        state.userRoles.add(user, role);
    };

    public func isAdmin(state : AccessControlState, caller : Principal) : Bool {
        switch (state.userRoles.get(caller)) {
            case (?#admin) { true };
            case (_) { false };
        };
    };

    public func hasPermission(state : AccessControlState, caller : Principal, requiredRole : UserRole) : Bool {
        let userRole = getUserRole(state, caller);

        switch (requiredRole) {
            case (#admin) {
                switch (userRole) {
                    case (#admin) { true };
                    case (_) { false };
                };
            };
            case (#user) {
                switch (userRole) {
                    case (#admin or #user) { true };
                    case (_) { false };
                };
            };
            case (#guest) { true };
        };
    };
}
