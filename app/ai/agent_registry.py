class AgentRegistry:
    """
    Simple registry to store and retrieve agent instances.
    """
    def __init__(self):
        self.agents = {}

    def register(self, name: str, agent_obj):
        """
        Register an agent object under a name.
        """
        self.agents[name] = agent_obj

    def get_agent(self, name: str):
        """
        Retrieve an agent by name.
        Returns None if not found.
        """
        return self.agents.get(name)
